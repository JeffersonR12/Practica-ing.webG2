# 🏛️ Sistema de Gestión de Bienes Patrimoniales

---

## 👨‍💻 Creadores del Proyecto

- **Ortega Poma Pedro** → 🖥️ Backend (API en PHP)
- **Baldeon Martinez David** → 🎨 Frontend (Interfaz)
- **Huaman Lazaro Jefferson** → 🗄️ Base de Datos

---

## 📌 Descripción del Proyecto

Sistema web que permite gestionar bienes patrimoniales dentro de una institución.

Permite registrar, asignar, controlar y dar seguimiento a bienes como computadoras, muebles y equipos.

---

## 🎯 Problema

El control de bienes se realiza en Excel o de forma manual, generando:

❌ Errores en asignación  
❌ Falta de control  
❌ No se sabe quién tiene cada bien  
❌ No hay historial  

---

## 💡 Solución

Se desarrolló un sistema que permite:

✅ Registrar bienes  
✅ Asignar bienes a personas  
✅ Gestionar desplazamientos  
✅ Guardar historial  
✅ Importar desde Excel  
✅ Generar reportes  

---

## 🧩 Funcionalidades

- 📦 Registro de bienes  
- 👤 Asignación de bienes  
- 🔄 Desplazamiento  
- 📋 Historial  
- 📊 Importación Excel  
- 📄 Reportes  

---

## 🏗️ Arquitectura

- 🖥️ Presentación → `Presentacion/`  
- ⚙️ Backend → `aplicacion/api/`  
- 🗄️ Base de datos → `infraestructura/BD/`  

---

## ⚙️ Tecnologías

- 🐘 PHP  
- 🗄️ MySQL  
- 🌐 HTML, CSS, JavaScript  

---

## 🧠 ¿Cómo funciona el sistema?

El sistema sigue este flujo:

1️⃣ Se registran bienes manualmente o desde Excel  
2️⃣ Los bienes se asignan a una persona  
3️⃣ Se pueden seleccionar bienes para transferirlos  
4️⃣ Se genera un desplazamiento (cambio de responsable)  
5️⃣ El sistema actualiza automáticamente la persona asignada  
6️⃣ Se guarda el historial del movimiento  
7️⃣ Se pueden generar reportes en cualquier momento  

👉 Todo esto es gestionado por el backend conectado a MySQL.

---

## 🗄️ Base de Datos

📍 Archivo:
compartido/bdpatrimonio.sql



Tablas principales:

- persona  
- bien  
- desplazamiento  
- historial  

---

## 🔑 Usuarios de Prueba

| Usuario     | Password      | Rol        |
|------------|-------------|-----------|
| admin      | admin123     | admin     |
| inventario | inventario123| inventario|
| usuario    | usuario123   | usuario   |

---

## ▶️ Cómo ejecutar el proyecto

### 🚀 1. Clonar repositorio
```bash
git clone https://github.com/JeffersonR12/Practica-ing.webG2.git
