# 💖 AffiniScore - El Camino del Amor

**AffiniScore** es una aplicación móvil multitarget gamificada diseñada para fortalecer la complicidad, comunicación y afinidad en las relaciones de pareja a través de actividades interactivas y asistencia basada en Inteligencia Artificial.

---

## 🚀 Características Principales

La aplicación divide la experiencia en un camino de **7 nodos interactivos** que la pareja debe superar de manera conjunta y lineal:

1. **Actos de Servicio (Nodo 1):** Configuración de compromisos cotidianos y checklist de tareas de afecto semanales.
2. **Trivia de Pareja (Nodo 2):** Cuestionario dinámico de opción múltiple para medir cuánto se conocen.
3. **¿Quién es más probable? (Nodo 3):** Minijuego de coincidencia cruzada con sincronización y votación mutua.
4. **La Ruleta Picante (Nodo 4):** Juego síncrono por turnos y límite de 3 retos por persona gestionado en tiempo real.
5. **Misiones Secretas (Nodo 5):** Checklist de sorpresas asignadas de forma aleatoria con validación reactiva de la pareja.
6. **Los 3 Deseos (Nodo 6):** Buzón romántico cruzado para cumplir y conceder deseos en la vida real.
7. **El Reporte AffiniScore (Nodo 7):** Introducción de AFI en formato novela visual y Dashboard de compatibilidad con medidores SVG animados y estadísticas acumuladas.

### 🌟 Funcionalidades Adicionales
* **AFI - Terapeuta Virtual:** Un chatbot integrado potenciado por **Google Gemini** con memoria multi-turno e instrucciones personalizadas según el perfil del usuario.
* **Canje de Recompensas:** Módulo de premios basado en el XP conjunto acumulado por la pareja, descontando el saldo individual en el canje.
* **Vinculación por Código:** Asociación instantánea de perfiles mediante códigos únicos (`AF-XXXX`) y sincronización en tiempo real vía WebSockets.

---

## 💻 Requisitos del Sistema

### 📱 Dispositivo Móvil
* **Android:** Versión 8.0 (Oreo) o superior.
* **iOS:** Versión 13.0 o superior (si se exporta mediante Capacitor).
* **Navegador Web:** Chrome, Safari, Firefox o Edge actualizados para visualización web interactiva.

### 🔑 Permisos Requeridos
* **Internet:** Acceso total de red requerido para la sincronización remota con Supabase y las consultas a la API de Google Gemini.
* **Almacenamiento Local (LocalStorage/Cookies):** Utilizado para guardar tokens de sesión, estados de login y configuraciones temporales de la interfaz.
* **Cámara/Galería (Opcional):** Permisos para cargar fotos de perfil o avatares personalizados.

---

## 🛠️ Stack Tecnológico

* **Frontend:**
  * [Ionic Framework 8](https://ionicframework.com/) (Híbrido multitarget: Web y Móvil)
  * [Angular 20](https://angular.dev/) (Standalone Components, Signals Reactivas y Routing)
  * [TypeScript](https://www.typescriptlang.org/) & SCSS (Vanilla CSS)
  * [SheetJS (xlsx)](https://sheetjs.com/) (Exportación de reportes)
* **Backend (BaaS):**
  * [Supabase](https://supabase.com/) (PostgreSQL Database, Supabase Auth y Realtime WebSockets)
* **Inteligencia Artificial:**
  * [Google Gemini 1.5 Flash](https://ai.google.dev/) (API de lenguaje natural)

---

## ⚙️ Instalación y Ejecución

### 📋 Prerrequisitos
* Node.js (v18+) e npm instalados localmente.
* Ionic CLI instalado de forma global:
  ```bash
  npm install -g @ionic/cli
  ```

### 📥 Clonar e Instalar Dependencias
1. Clonar el repositorio:
   ```bash
   git clone https://github.com/tu-usuario/affiniscore-app-ang.git
   cd affiniscore-app-ang
   ```
2. Instalar dependencias de Node:
   ```bash
   npm install
   ```

### 🛠️ Configurar Variables de Entorno
Crea o edita el archivo `src/environments/environment.ts` y añade tus credenciales:
```typescript
export const environment = {
  production: false,
  supabaseUrl: 'https://TU_PROYECTO.supabase.co',
  supabaseKey: 'TU_ANON_KEY_PUBLICA',
  geminiApiKey: 'TU_GEMINI_API_KEY'
};
```

### 🗄️ Inicializar Base de Datos (Supabase)
Sigue las instrucciones del [Manual de Instalación](C:/Users/alons/.gemini/antigravity/brain/a736ef31-1867-4c0f-8bee-8ee8f0c6aa9e/manual_instalacion.md) y ejecuta el script `SCRIPT_AFFINISCORE.sql` en el SQL Editor de tu consola de Supabase.

### 🚀 Iniciar en Desarrollo
Para iniciar la aplicación en el navegador web local:
```bash
ionic serve
```
La aplicación se abrirá automáticamente en `http://localhost:8100`.

### 🤖 Construye Android
Para generar la compilación nativa para dispositivos Android utilizando Capacitor:
1. Compilar los archivos web del proyecto:
   ```bash
   ionic build
   ```
2. Agregar la plataforma de Android al proyecto:
   ```bash
   npx cap add android
   ```
3. Sincronizar los archivos compilados con el directorio de Android:
   ```bash
   npx cap sync android
   ```
4. Abrir el proyecto nativo en Android Studio para compilar y generar el archivo APK:
   ```bash
   npx cap open android
   ```

---

## 📂 Estructura del Proyecto

A continuación se detalla la estructura principal de directorios del proyecto:

```text
affiniscore-app-ang/
 ├── src/
 │    ├── app/
 │    │    ├── components/       # Componentes UI reutilizables (ej. Modales, Botones, Tarjetas)
 │    │    ├── pages/            # Vistas principales de los 7 Nodos interactivos de la aplicación
 │    │    │    ├── actos/       # Nodo 1: Actos de Servicio
 │    │    │    ├── trivia/      # Nodo 2: Trivia de Pareja
 │    │    │    ├── probable/    # Nodo 3: ¿Quién es más probable?
 │    │    │    ├── ruleta/      # Nodo 4: La Ruleta Picante
 │    │    │    ├── misiones/    # Nodo 5: Misiones Secretas
 │    │    │    ├── buzon/       # Nodo 6: Los 3 Deseos (Buzón Romántico)
 │    │    │    └── actividad7/  # Nodo 7: El Reporte AffiniScore (Dashboard & Novela Visual)
 │    │    ├── services/         # Servicios de datos (SupabaseService, GeminiService, etc.)
 │    │    └── app.routes.ts     # Archivo de enrutamiento principal de Angular
 │    └── environments/          # Configuraciones de variables de entorno para desarrollo y producción
 ├── SCRIPT_AFFINISCORE.sql      # Script de inicialización de la Base de Datos para PostgreSQL
 └── README.md                   # Documentación principal del repositorio
```

---

## 👥 Guía de Uso por Rol

AffiniScore cuenta con dos enfoques de participación de usuario en la aplicación, mapeados directamente a la experiencia gamificada:

### 🎁 Donantes (Otorgantes de Afecto)
* **Función:** Los usuarios actúan como donantes activos de amor, tiempo y compromisos dentro de la relación.
* **Acciones Clave:**
  * Configurar y marcar compromisos semanales de cariño ("Actos de Servicio").
  * Registrar deseos cumplidos o conceder deseos pendientes ("Los 3 Deseos").
  * Recibir y realizar sorpresas sin que el otro lo sepa ("Misiones Secretas").
  * Aportar puntos de experiencia (XP) para canjear por premios conjuntos.

### 👑 Representantes (Administradores del Enlace)
* **Función:** El usuario que inicia el flujo de emparejamiento adopta el rol de representante del enlace, gestionando la vinculación y validación de las cuentas.
* **Acciones Clave:**
  * Solicitar y generar el código de vinculación alfanumérico único (`AF-XXXX`).
  * Enviar la invitación y coordinar la validación mutua con la pareja.
  * Iniciar la desvinculación segura en caso de cambio de estado a través de la función del sistema.
  * Visualizar estadísticas agregadas y descargar reportes consolidados en Excel desde el Dashboard.

---

## 🔌 API de Puntos Finales (Endpoints)

Dado que es una arquitectura sin servidor (Serverless BaaS), la aplicación interactúa directamente con los siguientes endpoints e interfaces de datos:

1. **Supabase REST API & Realtime WebSockets:**
   * `/rest/v1/profiles`: Lectura y actualización de perfiles (nombres, avatares, couple_id, XP).
   * `/rest/v1/parejas`: Registro de enlaces cruzados y códigos de vinculación activa.
   * `/rest/v1/tareas_actos_servicio`: Seguimiento de la lista de actividades cotidianas.
   * `/rest/v1/ruleta_retos`: Historial síncrono de retos realizados en la Ruleta.
   * `/rest/v1/deseos`: Gestión de los 3 Deseos con estados de validación.
2. **Supabase RPC (Remote Procedure Calls):**
   * `desvincular_pareja`: Función remota en Postgres encargada de desligar a dos usuarios limpiando de forma segura sus campos de relación en cascada.
3. **Google Gemini LLM API:**
   * `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash`: Endpoint REST utilizado por la terapeuta virtual AFI para procesamiento de chat en tiempo real con historial de conversación.

---

## 🛠️ Guía de Desarrollo y Contribución

### 📏 Estándares
* **Componentes Standalone:** Todo componente en la aplicación debe declararse usando standalone en Angular 20, manteniendo los imports inline para desacoplar el sistema.
* **Manejo de Estado con Signals:** Utilización estricta de `signal`, `computed` y `effect` en Angular para asegurar una propagación de cambios reactiva y de alto rendimiento.
* **Convención de Git:**
  * `feature/...` para nuevas funcionalidades.
  * `bugfix/...` para correcciones de errores detectados.
  * `hotfix/...` para reparaciones urgentes aplicadas a producción.
* **Estilo de Código:** Tipado estricto en TypeScript. Se prohíbe el uso excesivo de `any` para mantener la robustez del tipado con las entidades de Supabase.

---

## 👥 Autores y Colaboradores
* **Alonso** - Desarrollador Frontend y Base de Datos (Supabase)
* **Karen** - Diseñadora UX/UI y Desarrolladora de Actividades
