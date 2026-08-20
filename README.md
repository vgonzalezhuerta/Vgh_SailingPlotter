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

## Grabar con el móvil guardado

**Con la pantalla apagada no se puede grabar.** No es una carencia de la app: el navegador deja de
entregar posiciones cuando la pantalla se apaga, congela la página al pasar a segundo plano, y el
service worker no tiene acceso al GPS, así que tampoco se le puede delegar. Ninguna web puede
hacerlo; haría falta una app nativa.

Lo que sí se puede es el **modo bolsillo**: botón *Bolsi* sobre la carta, o *Regata → Registro de la
derrota → Modo bolsillo*. La pantalla se queda encendida pero **completamente en negro y sorda al
tacto**, así que puedes guardarte el móvil sin que el muslo pare la grabación. Por dentro sigue todo:
GPS grabando, cronómetro corriendo y los pasos de boya sonando. No se dibuja la carta, que es lo que
consume.

Se sale **deslizando media pantalla hacia abajo**. Un toque suelto no vale, a propósito.

Baja el brillo al mínimo antes de guardarlo. En pantallas **OLED** el negro apaga los píxeles y el
gasto se va casi todo al GPS; en **LCD** la retroiluminación sigue encendida y se ahorra bastante
menos.

### Interrupciones

Si aun así se corta el registro —pantalla apagada, la app al fondo, el sistema matando la pestaña o
el GPS sin señal—, el hueco **queda anotado** en vez de disimularse:

- En la carta el tramo sale en **gris discontinuo**, no como una bordada más: por ahí no se sabe por
  dónde fue el barco.
- El resumen de la derrota cuenta las interrupciones y el tiempo total sin datos.
- En el **GPX** cada corte abre un `<trkseg>` nuevo, que es justo lo que significa un segmento en ese
  formato, así que ningún programa unirá los extremos con una recta inventada.

Se considera interrupción cualquier tramo de más de 45 segundos sin posiciones.

---

## Detalles que conviene saber

**Rumbo del barco.** Se toma en cascada: compás por MQTT, brújula del móvil, y rumbo sobre el fondo
del GPS. El chip HDG indica cuál está en uso y en Ajustes puedes fijar una fuente y corregir la
declinación magnética. La brújula del móvil se desvía con los hierros del barco; navegando por
encima de nudo y medio, el COG suele ser más fiable.

**La salida.** En Táctica está la secuencia de cinco minutos de la regla 26, con el crono grande y,
debajo, en qué fase estás y qué debería estar ondeando ahora mismo. Los cuatro hitos —atención,
preparación, último minuto y salida— suenan solos, con el pitido largo en el minuto.

Elige la **bandera preparatoria** que saque el comité y la app te dice qué te juegas en el último
minuto: con la P nada, con la I hay que volver rodeando un extremo, con la Z son 20 %, con la U es
descalificación y con la negra es descalificación que no se perdona ni repitiendo la prueba. En el
último minuto ese aviso sale en rojo bajo el crono.

Debajo están todas las señales del comité: llamada individual y general, aplazamiento, anulación,
acortar, cambio de recorrido, chalecos y aviso. **Las instrucciones de regata del club mandan sobre
esto**: a veces cambian la secuencia o añaden banderas.

**Dirección del viento.** Los grados son siempre de **dónde viene**, como en toda la náutica y como
los sirve Open-Meteo: 180° es viento del sur. Las flechas, en cambio, apuntan **hacia dónde sopla**,
como en cualquier mapa del tiempo, así que con viento del sur la flecha sube hacia el norte. Para
que no haya duda, junto a los grados va el rumbo en letras: `178° S`, y bajo el HUD, `del S`.

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

Cuando cambies `sw.js` o los iconos, sube el número de `VER` dentro de `sw.js`. Si no, el navegador
sigue sirviendo lo que tenía guardado y no notarás el cambio.

---

## Los iconos

Salen de una foto de un barco frente a la costa, en `iconos-fuente/barco.jpg`. Para regenerarlos:

```
pip install Pillow
python3 iconos-fuente/generar-iconos.py
```

Escribe los tres PNG en `icons/`. El script lleva dentro, comentado, el porqué del encuadre: dónde
está medido el barco, cuál es la mayor ventana de mar limpio a su alrededor y por qué el maskable
usa un recorte más ancho que los demás.

Esa carpeta no forma parte de la app: no se descarga ni hace falta para que funcione. Si cambias la
foto, mide el barco en la nueva y ajusta las constantes de arriba del script.

Aviso: **Android tarda en refrescar el icono** de una app ya instalada. Si sigues viendo el
anterior, quítala de la pantalla de inicio y vuelve a instalarla.
