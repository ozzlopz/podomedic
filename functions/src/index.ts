import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { randomBytes } from "node:crypto";
import { getTimeSlotsForDate, isValidTimeSlot, SLOT_DURATION_MINUTES } from "./booking";

initializeApp();

type AdminType = "superadmin" | "admin";
type AccountStatus = "active" | "inactive";
type AppointmentStatus = "pending" | "confirmed" | "cancelled" | "completed";
type PurchaseRequestItem = {
  id: string;
  slug: string;
  name: string;
  price: number;
  quantity: number;
};

function splitName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);

  if (parts.length <= 1) {
    return {
      first_name: parts[0] ?? fullName.trim(),
      last_name: "",
    };
  }

  return {
    first_name: parts.slice(0, -1).join(" "),
    last_name: parts.at(-1) ?? "",
  };
}

function createTemporaryPassword() {
  return randomBytes(18).toString("base64url");
}

function getDayBounds(dateValue: string) {
  const start = new Date(`${dateValue}T00:00:00`);
  const end = new Date(`${dateValue}T23:59:59`);

  return { start, end };
}

function formatTimeFromDate(date: Date) {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

async function assertSlotAvailable(params: {
  date: string;
  time: string;
  excludeAppointmentId?: string;
}) {
  const db = getFirestore();
  const { start, end } = getDayBounds(params.date);

  if (!isValidTimeSlot(params.date, params.time)) {
    throw new HttpsError("invalid-argument", "La hora seleccionada no pertenece a un bloque disponible de 90 minutos.");
  }

  const [appointmentsSnapshot, blockedSlotsSnapshot] = await Promise.all([
    db.collection("appointments")
      .where("scheduledAt", ">=", start)
      .where("scheduledAt", "<=", end)
      .get(),
    db.collection("appointment_blocks")
      .where("date", "==", params.date)
      .where("time", "==", params.time)
      .get(),
  ]);

  const conflictingAppointment = appointmentsSnapshot.docs.find((docItem) => {
    if (params.excludeAppointmentId && docItem.id === params.excludeAppointmentId) {
      return false;
    }

    const data = docItem.data();
    const scheduledTime =
      typeof data?.scheduledTime === "string"
        ? data.scheduledTime
        : data?.scheduledAt?.toDate
          ? formatTimeFromDate(data.scheduledAt.toDate())
          : "";

    return data?.status !== "cancelled" && scheduledTime === params.time;
  });

  if (conflictingAppointment) {
    throw new HttpsError("already-exists", "Ese horario ya fue reservado.");
  }

  if (!blockedSlotsSnapshot.empty) {
    throw new HttpsError("failed-precondition", "Ese horario fue bloqueado por administración.");
  }
}

async function findOrCreatePatientProfile(params: {
  email: string;
  name: string;
  phone?: string;
  source: "booking" | "admin";
}) {
  const auth = getAuth();
  const db = getFirestore();
  const normalizedEmail = params.email.trim().toLowerCase();
  const parsedName = splitName(params.name);

  try {
    const existingUser = await auth.getUserByEmail(normalizedEmail);
    const userRef = db.collection("users").doc(existingUser.uid);
    const existingProfile = await userRef.get();

    const nextProfile = {
      first_name: existingProfile.data()?.first_name ?? parsedName.first_name,
      last_name: existingProfile.data()?.last_name ?? parsedName.last_name,
      email: normalizedEmail,
      phone: params.phone ?? existingProfile.data()?.phone ?? "",
      role: existingProfile.data()?.role ?? "customer",
      status: existingProfile.data()?.status ?? "active",
      createdAt: existingProfile.data()?.createdAt ?? FieldValue.serverTimestamp(),
      source: existingProfile.data()?.source ?? params.source,
    };

    await userRef.set(nextProfile, { merge: true });

    return {
      uid: existingUser.uid,
      created: false,
      profile: nextProfile,
    };
  } catch (error) {
    const authError = error as { code?: string };

    if (authError.code !== "auth/user-not-found") {
      throw error;
    }
  }

  const newUser = await auth.createUser({
    email: normalizedEmail,
    password: createTemporaryPassword(),
    displayName: params.name.trim(),
    disabled: true,
  });

  const newProfile = {
    first_name: parsedName.first_name,
    last_name: parsedName.last_name,
    email: normalizedEmail,
    phone: params.phone ?? "",
    role: "customer",
    status: "inactive",
    createdAt: FieldValue.serverTimestamp(),
    source: params.source,
  };

  await db.collection("users").doc(newUser.uid).set(newProfile);

  return {
    uid: newUser.uid,
    created: true,
    profile: newProfile,
  };
}

async function assertSuperAdmin(uid: string) {
  const db = getFirestore();
  const snapshot = await db.collection("users").doc(uid).get();

  if (!snapshot.exists) {
    throw new HttpsError("permission-denied", "No se encontró el perfil del usuario autenticado.");
  }

  const data = snapshot.data();

  if (data?.role !== "admin" || data?.admin_type !== "superadmin") {
    throw new HttpsError("permission-denied", "Solo un superadministrador puede realizar esta acción.");
  }

  return data;
}

async function assertAdmin(uid: string) {
  const db = getFirestore();
  const snapshot = await db.collection("users").doc(uid).get();

  if (!snapshot.exists) {
    throw new HttpsError("permission-denied", "No se encontró el perfil del usuario autenticado.");
  }

  const data = snapshot.data();

  if (data?.role !== "admin") {
    throw new HttpsError("permission-denied", "Solo un administrador puede realizar esta acción.");
  }

  return data;
}

export const createAdminUser = onCall(async (request) => {
  if (!request.auth?.uid) {
    throw new HttpsError("unauthenticated", "Debes iniciar sesión para crear administradores.");
  }

  await assertSuperAdmin(request.auth.uid);

  const {
    email,
    password,
    first_name,
    last_name,
    phone,
    admin_type,
  } = request.data as {
    email?: string;
    password?: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
    admin_type?: AdminType;
  };

  if (!email || !password || !first_name || !last_name) {
    throw new HttpsError("invalid-argument", "Nombre, apellido, correo y contraseña son obligatorios.");
  }

  if (admin_type !== "admin" && admin_type !== "superadmin") {
    throw new HttpsError("invalid-argument", "El tipo de administrador es inválido.");
  }

  const auth = getAuth();
  const db = getFirestore();
  const userRecord = await auth.createUser({
    email,
    password,
    displayName: `${first_name} ${last_name}`.trim(),
    disabled: false,
  });

  await db.collection("users").doc(userRecord.uid).set({
    first_name,
    last_name,
    email,
    phone: phone ?? "",
    role: "admin",
    admin_type,
    status: "active",
    createdAt: FieldValue.serverTimestamp(),
  });

  return {
    uid: userRecord.uid,
    message: "Administrador creado correctamente.",
  };
});

export const setAdminAccountStatus = onCall(async (request) => {
  if (!request.auth?.uid) {
    throw new HttpsError("unauthenticated", "Debes iniciar sesión para actualizar administradores.");
  }

  await assertSuperAdmin(request.auth.uid);

  const { uid, status } = request.data as { uid?: string; status?: AccountStatus };

  if (!uid || (status !== "active" && status !== "inactive")) {
    throw new HttpsError("invalid-argument", "Los datos para actualizar el estado son inválidos.");
  }

  const auth = getAuth();
  const db = getFirestore();

  await auth.updateUser(uid, {
    disabled: status === "inactive",
  });

  await db.collection("users").doc(uid).update({
    status,
  });

  return {
    message: status === "active" ? "Administrador activado." : "Administrador desactivado.",
  };
});

export const createCustomerUser = onCall(async (request) => {
  if (!request.auth?.uid) {
    throw new HttpsError("unauthenticated", "Debes iniciar sesión para crear pacientes.");
  }

  await assertAdmin(request.auth.uid);

  const {
    email,
    password,
    first_name,
    last_name,
    phone,
  } = request.data as {
    email?: string;
    password?: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
  };

  if (!email || !password || !first_name || !last_name) {
    throw new HttpsError("invalid-argument", "Nombre, apellido, correo y contraseña son obligatorios.");
  }

  const auth = getAuth();
  const db = getFirestore();
  const userRecord = await auth.createUser({
    email,
    password,
    displayName: `${first_name} ${last_name}`.trim(),
    disabled: false,
  });

  await db.collection("users").doc(userRecord.uid).set({
    first_name,
    last_name,
    email,
    phone: phone ?? "",
    role: "customer",
    status: "active",
    createdAt: FieldValue.serverTimestamp(),
  });

  return {
    uid: userRecord.uid,
    message: "Paciente creado correctamente.",
  };
});

export const setCustomerAccountStatus = onCall(async (request) => {
  if (!request.auth?.uid) {
    throw new HttpsError("unauthenticated", "Debes iniciar sesión para actualizar pacientes.");
  }

  await assertAdmin(request.auth.uid);

  const { uid, status } = request.data as { uid?: string; status?: AccountStatus };

  if (!uid || (status !== "active" && status !== "inactive")) {
    throw new HttpsError("invalid-argument", "Los datos para actualizar el estado son inválidos.");
  }

  const db = getFirestore();
  const customerSnapshot = await db.collection("users").doc(uid).get();

  if (!customerSnapshot.exists || customerSnapshot.data()?.role !== "customer") {
    throw new HttpsError("failed-precondition", "La cuenta indicada no corresponde a un paciente.");
  }

  const auth = getAuth();

  await auth.updateUser(uid, {
    disabled: status === "inactive",
  });

  await db.collection("users").doc(uid).update({
    status,
  });

  return {
    message: status === "active" ? "Paciente activado." : "Paciente desactivado.",
  };
});

export const createBookingAppointment = onCall(async (request) => {
  const {
    name,
    email,
    date,
    time,
    message,
  } = request.data as {
    name?: string;
    email?: string;
    date?: string;
    time?: string;
    message?: string;
  };

  if (!name || !email || !date || !time) {
    throw new HttpsError("invalid-argument", "Nombre, correo, fecha y hora son obligatorios.");
  }

  await assertSlotAvailable({ date, time });

  const db = getFirestore();
  const patient = await findOrCreatePatientProfile({
    email,
    name,
    source: "booking",
  });

  const scheduledAt = new Date(`${date}T${time}:00`);

  if (Number.isNaN(scheduledAt.getTime())) {
    throw new HttpsError("invalid-argument", "La fecha u hora de la cita no son válidas.");
  }

  const appointmentRef = await db.collection("appointments").add({
    userId: patient.uid,
    patientName: name.trim(),
    patientEmail: email.trim().toLowerCase(),
    patientPhone: "",
    scheduledDate: date,
    scheduledTime: time,
    scheduledAt,
    reason: message?.trim() || "Solicitud desde formulario público",
    notes: message?.trim() || "",
    status: "pending",
    source: "booking",
    slotDurationMinutes: SLOT_DURATION_MINUTES,
    createdAt: FieldValue.serverTimestamp(),
  });

  return {
    appointmentId: appointmentRef.id,
    patientId: patient.uid,
    patientCreated: patient.created,
    message: "Tu solicitud de cita fue registrada correctamente.",
  };
});

export const createAdminAppointment = onCall(async (request) => {
  if (!request.auth?.uid) {
    throw new HttpsError("unauthenticated", "Debes iniciar sesión para crear citas.");
  }

  await assertAdmin(request.auth.uid);

  const {
    patientId,
    patientName,
    patientEmail,
    date,
    time,
    reason,
    notes,
    status,
  } = request.data as {
    patientId?: string;
    patientName?: string;
    patientEmail?: string;
    date?: string;
    time?: string;
    reason?: string;
    notes?: string;
    status?: AppointmentStatus;
  };

  if (!patientId || !date || !time || !reason) {
    throw new HttpsError("invalid-argument", "Paciente, fecha, hora y motivo son obligatorios.");
  }

  await assertSlotAvailable({ date, time });

  const db = getFirestore();
  const userSnapshot = await db.collection("users").doc(patientId).get();

  if (!userSnapshot.exists || userSnapshot.data()?.role !== "customer") {
    throw new HttpsError("failed-precondition", "La cita debe ligarse a un paciente válido.");
  }

  const userData = userSnapshot.data();
  const scheduledAt = new Date(`${date}T${time}:00`);

  if (Number.isNaN(scheduledAt.getTime())) {
    throw new HttpsError("invalid-argument", "La fecha u hora de la cita no son válidas.");
  }

  const appointmentRef = await db.collection("appointments").add({
    userId: patientId,
    patientName:
      patientName?.trim() ||
      [userData?.first_name, userData?.last_name].filter(Boolean).join(" ") ||
      userData?.email ||
      "Paciente",
    patientEmail: patientEmail?.trim().toLowerCase() || userData?.email || "",
    patientPhone: userData?.phone ?? "",
    scheduledDate: date,
    scheduledTime: time,
    scheduledAt,
    reason: reason.trim(),
    notes: notes?.trim() || "",
    status: status ?? "confirmed",
    source: "admin",
    slotDurationMinutes: SLOT_DURATION_MINUTES,
    createdAt: FieldValue.serverTimestamp(),
  });

  return {
    appointmentId: appointmentRef.id,
    message: "Cita creada correctamente.",
  };
});

export const getBookingAvailability = onCall(async (request) => {
  const { date } = request.data as { date?: string };

  if (!date) {
    throw new HttpsError("invalid-argument", "Debes indicar una fecha.");
  }

  const slots: string[] = getTimeSlotsForDate(date);

  if (slots.length === 0) {
    return {
      date,
      slotDurationMinutes: SLOT_DURATION_MINUTES,
      slots,
      availableSlots: [] as string[],
      occupiedSlots: [] as string[],
      blockedSlots: [] as string[],
    };
  }

  const db = getFirestore();
  const { start, end } = getDayBounds(date);
  const [appointmentsSnapshot, blockedSlotsSnapshot] = await Promise.all([
    db.collection("appointments")
      .where("scheduledAt", ">=", start)
      .where("scheduledAt", "<=", end)
      .get(),
    db.collection("appointment_blocks")
      .where("date", "==", date)
      .get(),
  ]);

  const occupiedSlots = new Set(
    appointmentsSnapshot.docs
      .filter((docItem) => docItem.data()?.status !== "cancelled")
      .map((docItem) => {
        const data = docItem.data();
        return typeof data?.scheduledTime === "string"
          ? data.scheduledTime
          : data?.scheduledAt?.toDate
            ? formatTimeFromDate(data.scheduledAt.toDate())
            : "";
      })
      .filter((timeValue): timeValue is string => Boolean(timeValue)),
  );

  const blockedSlots = new Set(
    blockedSlotsSnapshot.docs
      .map((docItem) => docItem.data()?.time)
      .filter((timeValue): timeValue is string => Boolean(timeValue)),
  );

  return {
    date,
    slotDurationMinutes: SLOT_DURATION_MINUTES,
    slots,
    availableSlots: slots.filter((slot) => !occupiedSlots.has(slot) && !blockedSlots.has(slot)),
    occupiedSlots: slots.filter((slot) => occupiedSlots.has(slot)),
    blockedSlots: slots.filter((slot) => blockedSlots.has(slot)),
  };
});

export const createAppointmentBlock = onCall(async (request) => {
  if (!request.auth?.uid) {
    throw new HttpsError("unauthenticated", "Debes iniciar sesión para bloquear horarios.");
  }

  await assertAdmin(request.auth.uid);

  const { date, time, reason } = request.data as {
    date?: string;
    time?: string;
    reason?: string;
  };

  if (!date || !time) {
    throw new HttpsError("invalid-argument", "Fecha y hora son obligatorias.");
  }

  await assertSlotAvailable({ date, time });

  const db = getFirestore();
  const blockRef = await db.collection("appointment_blocks").add({
    date,
    time,
    reason: reason?.trim() || "",
    createdBy: request.auth.uid,
    slotDurationMinutes: SLOT_DURATION_MINUTES,
    createdAt: FieldValue.serverTimestamp(),
  });

  return {
    blockId: blockRef.id,
    message: "Horario bloqueado correctamente.",
  };
});

export const removeAppointmentBlock = onCall(async (request) => {
  if (!request.auth?.uid) {
    throw new HttpsError("unauthenticated", "Debes iniciar sesión para desbloquear horarios.");
  }

  await assertAdmin(request.auth.uid);

  const { blockId } = request.data as { blockId?: string };

  if (!blockId) {
    throw new HttpsError("invalid-argument", "Debes indicar el bloque a eliminar.");
  }

  const db = getFirestore();
  await db.collection("appointment_blocks").doc(blockId).delete();

  return {
    message: "Horario desbloqueado correctamente.",
  };
});

export const createPurchaseRequest = onCall(async (request) => {
  const {
    name,
    email,
    phone,
    notes,
    subtotal,
    items,
    source,
  } = request.data as {
    name?: string;
    email?: string;
    phone?: string;
    notes?: string;
    subtotal?: number;
    items?: PurchaseRequestItem[];
    source?: "cart_whatsapp" | "cart_contact";
  };

  const normalizedName = name?.trim();
  const normalizedEmail = email?.trim().toLowerCase();
  const normalizedPhone = phone?.trim() ?? "";
  const normalizedNotes = notes?.trim() ?? "";
  const requestSource = source ?? "cart_whatsapp";
  const normalizedSubtotal = Number(subtotal);

  if (!normalizedName || !normalizedEmail) {
    throw new HttpsError("invalid-argument", "Nombre y correo son obligatorios.");
  }

  if (!Array.isArray(items) || items.length === 0) {
    throw new HttpsError("invalid-argument", "Debes incluir al menos un producto en la solicitud.");
  }

  const sanitizedItems = items
    .map((item) => ({
      id: item?.id?.trim(),
      slug: item?.slug?.trim(),
      name: item?.name?.trim(),
      price: Number(item?.price),
      quantity: Number(item?.quantity),
    }))
    .filter(
      (item) =>
        Boolean(item.id) &&
        Boolean(item.slug) &&
        Boolean(item.name) &&
        Number.isFinite(item.price) &&
        item.price >= 0 &&
        Number.isInteger(item.quantity) &&
        item.quantity > 0,
    );

  if (sanitizedItems.length !== items.length) {
    throw new HttpsError("invalid-argument", "La solicitud contiene productos inválidos.");
  }

  const calculatedSubtotal = sanitizedItems.reduce((total, item) => total + item.price * item.quantity, 0);

  if (!Number.isFinite(normalizedSubtotal) || Math.abs(calculatedSubtotal - normalizedSubtotal) > 1) {
    throw new HttpsError("invalid-argument", "El subtotal enviado no coincide con los productos seleccionados.");
  }

  const db = getFirestore();
  const purchaseRequestRef = await db.collection("purchase_requests").add({
    userId: request.auth?.uid ?? null,
    customerName: normalizedName,
    customerEmail: normalizedEmail,
    customerPhone: normalizedPhone,
    notes: normalizedNotes,
    subtotal: calculatedSubtotal,
    items: sanitizedItems,
    itemCount: sanitizedItems.reduce((total, item) => total + item.quantity, 0),
    status: "new",
    source: requestSource,
    createdAt: FieldValue.serverTimestamp(),
  });

  return {
    requestId: purchaseRequestRef.id,
    message: "Solicitud de compra registrada correctamente.",
  };
});
