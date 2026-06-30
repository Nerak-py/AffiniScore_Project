<h1 align="center">💖AffiniScore_Project💖</h1>

<p align="center">
  <img src="https://readme-typing-svg.herokuapp.com?font=Baloo+2&size=26&pause=1200&color=F47068&center=true&vCenter=true&width=900&lines=Proyecto+de+Academia+Tecnológica+Triskeledu;Impulsado+por+Alumnos+de+DUOC+UC;Puntos+para+tu+relacion+💞;Creciendo+juntos+✨" />
</p>

<p align="center">
  <img src="Affiniscore github.png" alt="AffiniScore Banner" width="100%">
</p>

<p align="center">
  <img src="https://img.shields.io/github/stars/Nerak-py/AffiniScore_Project?style=for-the-badge&color=F47068&labelColor=FFF5F7">
  
  <img src="https://img.shields.io/github/forks/Nerak-py/AffiniScore_Project?style=for-the-badge&color=F4D03F&labelColor=FFF5F7">

  <img src="https://img.shields.io/badge/STATUS-ACTIVE-9FE870?style=for-the-badge">

</p>

---
## 💌 Índice

- [💖 ¿Qué es AffiniScore?](#-qué-es-affiniscore)
- [🎯 Nuestro objetivo](#-nuestro-objetivo)
- [📱 Capturas del Proyecto](#-capturas-del-proyecto)
- [🌟 Funcionalidades](#-funcionalidades)
- [🫶 Tecnologías](#-tecnologías)
- [💻 Requisitos del Sistema](#-requisitos-del-sistema)
- [⚙️ Instalación y Ejecución](#-instalación-y-ejecucion)
- [📂 Estructura del Proyecto](#-estructura-del-proyecto)
- [👥 Guía de Uso por Rol](#-guía-de-uso-por-rol)
- [🔌 API de Puntos Finales (Endpoints)](#-api-de-puntos-finales-endpoints)
- [🛠️ Guía de Desarrollo y Contribución](#-guia-de-desarrollo-y-contribución)
- [👥 Equipo](#-equipo)


---
## 💌 ¿Qué es AffiniScore?

AffiniScore es una aplicación móvil diseñada para fortalecer el vínculo entre parejas y evitar la monotonía mediante la gamificación. Nuestro objetivo es transformar las interacciones cotidianas en una experiencia dinámica, interactiva y gratificante.

---
## 🎯 Nuestro objetivo
Actualmente, muchas aplicaciones enfocadas en relaciones de pareja sufren de una baja retención de usuarios. Esto ocurre debido a la falta de incentivos o motivaciones sostenibles a largo plazo.

Nuestra misión es revertir esta tendencia ofreciendo una plataforma que promueva la participación constante y el crecimiento continuo de la relación.

---
## 📱 Capturas del Proyecto

<p align="center">
  <img src="SC1.png" width="250">
  <img src="SC2.png" width="250">
  <img src="SC3.png" width="250">
</p>

---
## 🌟 Funcionalidades
💖 Sistema de puntos para parejas  
🎯 Misiones diarias interactivas  
✨ Gamificación de relaciones  
🫶 Tienda de recompensas  
📱 Experiencia móvil moderna  
🤖 Terapia virtual asistida

---
## 🫶 Tecnologías

<p align="center">

💖 <b>Frontend</b><br><br>

<img src="https://skillicons.dev/icons?i=angular,ts,scss" /><br><br>

<img src="https://img.shields.io/badge/Ionic_8-3880FF?style=for-the-badge&logo=ionic&logoColor=white">
<img src="https://img.shields.io/badge/RxJS-B7178C?style=for-the-badge&logo=reactivex&logoColor=white">
<img src="https://img.shields.io/badge/Angular_Signals-DD0031?style=for-the-badge&logo=angular&logoColor=white">

</p>

---

<p align="center">

☁️ <b>Backend y Cloud</b><br><br>

<img src="https://skillicons.dev/icons?i=supabase,postgres" /><br><br>

<img src="https://img.shields.io/badge/Supabase_Auth-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white">
<img src="https://img.shields.io/badge/Supabase_Realtime-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white">

</p>

---


<p align="center">

🧠 <b>Inteligencia Artificial</b><br><br>

<img src="https://img.shields.io/badge/Google_Generative_AI-4285F4?style=for-the-badge&logo=google&logoColor=white">

<img src="https://img.shields.io/badge/Gemini_API-8E75FF?style=for-the-badge&logo=google-gemini&logoColor=white">

</p>

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
   git clone https://github.com/Nerak-py/AffiniScore_Project.git
   cd AffiniScore_Project
   ```
2. Entrar a la carpeta de la aplicación e instalar dependencias de Node:
   ```bash
   cd Producto
   npm install
   ```

### 🛠️ Configurar Variables de Entorno
Crea o edita el archivo `Producto/src/environments/environment.ts` y añade tus credenciales:
```typescript
export const environment = {
  production: false,
  supabaseUrl: 'https://TU_PROYECTO.supabase.co',
  supabaseKey: 'TU_ANON_KEY_PUBLICA',
  geminiApiKey: 'TU_GEMINI_API_KEY'
};
```

### 🗄️ Inicializar Base de Datos (Supabase)
Ejecuta el script `Documentación/SCRIPT_AFFINISCORE - copia.txt` en el SQL Editor de tu consola de Supabase para estructurar las tablas, habilitar RLS y activar los triggers de automatización de perfiles.

### 🚀 Iniciar en Desarrollo
Para iniciar la aplicación en el navegador web local:
```bash
cd Producto
ionic serve
```
La aplicación se abrirá automáticamente en `http://localhost:8100`.

### 🤖 Construye Android
Para generar la compilación nativa para dispositivos Android utilizando Capacitor:
1. Compilar los archivos web del proyecto:
   ```bash
   cd Producto
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
AffiniScore_Project/
 ├── Documentación/              # Documentos académicos y manuales del proyecto
 ├── Gestión/                    # Documentos de planificación y administración
 ├── Producto/                   # Código fuente de la aplicación Angular / Ionic
 │    ├── src/
 │    │    ├── app/
 │    │    │    ├── components/  # Componentes UI reutilizables
 │    │    │    ├── pages/       # Vistas de los 7 Nodos interactivos de la aplicación
 │    │    │    ├── services/    # Servicios de datos (SupabaseService, GeminiService)
 │    │    │    └── app.routes.ts# Enrutamiento principal de Angular
 │    │    └── environments/     # Configuración de variables de entorno
 │    └── package.json           # Dependencias y scripts del proyecto
 └── README.md                   # Documentación principal en la raíz
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
## 👥 Equipo

<h2 align="center">👥 Equipo</h2>

<table align="center">
<tr>

<td align="center" width="300">

<img src="https://github.com/Al0naas.png" width="120" style="border-radius: 50%;" />

### 🖤 Alonso Esteban Robles Franchis

🗄️ DBA  
📊 Analista Funcional  
🧪 QA

</td>

<td align="center" width="300">

<img src="https://github.com/Nerak-py.png" width="120" style="border-radius: 50%;" />

### 💖 Karen Andrea Santibañez Quezada

🧪 Testing  
🎨 Diseñadora  
💻 Frontend

</td>

</tr>
</table>


---
<h3 align="center">
💖 Puntos para tu Relación - Creciendo juntos ✨
</h3>

<p align="center">
  Desarrollado por Academia Tecnológica Triskeledu + DUOC UC
</p>

<p align="center">
  <img src="logo.png.png" alt="AffiniScore Banner" width="100%">
</p>
