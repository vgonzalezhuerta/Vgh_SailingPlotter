# Plóter de regata

Plóter de vela para el móvil: boyas sobre carta real, posición y rumbo en vivo, sensores por MQTT,
previsión de viento y rumbos recomendados. Funciona sin cobertura una vez descargada la zona.

---

## Subirlo a GitHub Pages

1. Crea un repositorio **público** nuevo. Si es privado, Pages exige plan de pago.
2. Sube estos archivos **en la raíz del repo**, respetando la carpeta `icons/`:

   ```
   index.html
   sw.js
   manifest.webmanifest
   icons/icon-192.png
   icons/icon-512.png
   icons/icon-maskable-512.png
   .nojekyll
   ```

   > **La carpeta se llama `icons`, en minúscula.** GitHub Pages distingue mayúsculas de
   > minúsculas: si la subes como `Icons/`, los iconos dan 404, el service worker no llega a
   > instalarse y Android deja de ofrecer la instalación. Es el fallo más fácil de cometer
   > arrastrando la carpeta desde Windows o macOS.

   Se puede hacer desde el navegador: *Add file → Upload files*, arrastrar todo y confirmar.
3. **Settings → Pages**. En *Source* elige `Deploy from a branch`, rama `main`, carpeta `/ (root)`.
   Guarda.
4. Espera un par de minutos. La URL será `https://TU-USUARIO.github.io/TU-REPO/`.
5. Ábrela en el móvil. Concede el permiso de ubicación cuando lo pida.

Al ser HTTPS, el GPS y la brújula ya funcionan.

---

## Instalarla en Android

Con la web ya publicada por HTTPS, es una app instalable de verdad: icono propio, pantalla
completa sin barra del navegador y arranque sin cobertura.

- **Desde la propia app:** *Ajustes → Instalar en el móvil → Instalar la app*. El botón aparece
  cuando Chrome confirma que se cumple todo. Si en su lugar pone *usa el menú del navegador*,
  recarga la página: el navegador la ofrece cuando ha terminado de guardarla.
- **Desde Chrome:** menú **⋮ → Instalar aplicación** (o *Añadir a pantalla de inicio*).
- **En iPhone y iPad** no existe el botón: *Compartir → Añadir a pantalla de inicio*.

En *Ajustes → Diagnóstico*, la fila **Instalada como app** dice si estás en la versión instalada
o dentro del navegador.

Manteniendo pulsado el icono salen dos accesos directos: **Boyas** (recorrido) y **Cartas**
(descarga sin conexión).

Requisitos que ya cumple el repo, por si tocas algo: HTTPS, `manifest.webmanifest` enlazado desde
el `<head>`, iconos de 192 y 512 accesibles, `display: standalone` y un service worker que sirve
la página sin red.

---

## Antes de salir a navegar

En el puerto, con wifi:

1. Mete las boyas del recorrido (punteo en la carta y ajuste con las ruletas).
2. **Ajustes → Cartas sin conexión → Descargar esta zona**. Cubre el área de las boyas más dos
   millas de margen.
3. Comprueba que el chip **Red** dice *en línea* y que aparece el número de mosaicos guardados.

En el agua ya puedes quedarte sin datos: carta, boyas, laylines, cronómetro y rumbos siguen
funcionando. Lo único que necesita conexión es la previsión meteorológica, así que actualízala
antes de soltar amarras.

---

## Sensores por MQTT

Tiene que ser **MQTT sobre WebSocket**. Un broker TCP en el 1883 no sirve desde un navegador.

Como la página va por HTTPS, la conexión debe ser `wss://`, nunca `ws://`: el navegador bloquea el
contenido mixto sin excepción posible. En Mosquitto:

```
listener 9001
protocol websockets
certfile /etc/mosquitto/certs/server.crt
keyfile  /etc/mosquitto/certs/server.key
```

Con certificado autofirmado, la primera vez hay que abrir `https://IP-DEL-BROKER:9001` en el
navegador y aceptar la excepción; después la app conecta sin problema.

Para descubrir los topics: conecta con el filtro `#`, mira la lista de mensajes recibidos y asigna
cada uno a su dato desde el desplegable. Cada campo admite una clave JSON anidada
(`wind.aws` para `{"wind":{"aws":14.2}}`) y un multiplicador de unidades (m/s → nudos es `1.944`).

Si solo publicas viento aparente, el viento real se calcula con el rumbo y la velocidad del barco.

---

## Detalles que conviene saber

**Rumbo del barco.** Se toma en cascada: compás por MQTT, brújula del móvil, y rumbo sobre el fondo
del GPS. El chip HDG indica cuál está en uso y en Ajustes puedes fijar una fuente y corregir la
declinación magnética. La brújula del móvil se desvía con los hierros del barco; navegando por
encima de nudo y medio, el COG suele ser más fiable.

**Laylines.** Se trazan con dos ángulos fijos, el TWA de ceñida y el de empopada, configurables en
Táctica. No son polares reales: si tienes la tabla de tu barco, ahí es donde más se gana.

**Mosaicos.** Los servidores de OpenStreetMap y OpenSeaMap son gratuitos y de uso comedido. La
descarga va limitada y espaciada a propósito. Para uso intensivo, monta tu propia fuente de
mosaicos o usa cartografía náutica oficial.

**Esto no sustituye a una carta náutica.** Es una ayuda táctica para regatear. La navegación segura
sigue siendo cosa del plóter homologado, la carta de papel y el patrón.

---

## Actualizar la app

Sube el `index.html` nuevo al repo. La próxima vez que la abras te preguntará si quieres recargar
con la versión nueva. Las cartas descargadas no se borran al actualizar.

Si algo se queda pillado: Ajustes del navegador → borrar datos del sitio, y vuelve a entrar.
