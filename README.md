# Podomedic

Plataforma web para consultorio podológico construida con Next.js, React, Firebase Authentication y Firestore.

## Características

- **Páginas públicas**: Landing page, contacto y reserva de citas
- **Autenticación**: Sistema de login con roles de admin y customer
- **Panel de Admin**: Visualizar clientes registrados, registrar nuevos clientes, ver citas
- **Panel de Customer**: Ver/editar perfil, historial de consultas
- **Base de datos**: Firestore para almacenamiento de datos

## Tecnologías

- **Frontend**: Next.js 16, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Autenticación**: Firebase Auth
- **Base de datos**: Firestore
- **Estilos**: Tailwind CSS

## Instalación

1. Clona el repositorio
2. Instala dependencias: `npm install`
3. Configura Firebase:
   - Crea un proyecto en Firebase Console
   - Habilita Authentication y Firestore
   - Copia las credenciales a `.env.local`
4. Ejecuta el servidor de desarrollo: `npm run dev`

## Variables de Entorno

Crea un archivo `.env.local` con:

```
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

## Scripts

- `npm run dev`: Inicia el servidor de desarrollo
- `npm run build`: Construye la aplicación para producción
- `npm run start`: Inicia el servidor de producción
- `npm run lint`: Ejecuta ESLint

## Estructura del Proyecto

- `src/app/`: Páginas de Next.js App Router
- `src/components/`: Componentes reutilizables
- `src/contexts/`: Contextos de React (autenticación)
- `src/lib/`: Utilidades y configuración (Firebase)

## Despliegue

Despliega en Vercel o cualquier plataforma que soporte Next.js. Asegúrate de configurar las variables de entorno en la plataforma de despliegue.
