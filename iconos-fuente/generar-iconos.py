#!/usr/bin/env python3
"""Genera los iconos de la app a partir de la foto del barco.

    pip install Pillow
    python3 iconos-fuente/generar-iconos.py

Escribe los tres PNG en icons/, sobrescribiendo los que haya.

------------------------------------------------------------------------
Cómo se eligió el encuadre
------------------------------------------------------------------------
El barco se midió sobre la foto en vez de recortar a ojo: ocupa 139x207 px
y su centro cae en (866, 899). Los dos recortes están centrados ahí al
píxel, que es lo que hace que el barco no baile entre tamaños.

El límite lo pone el entorno. Alrededor del barco, la mayor ventana
cuadrada de mar limpio —sin horizonte, sin el pino, sin la farola y sin el
muro del paseo— es de 432 px. Dentro de ese margen:

  · 296 px para los iconos normales. El barco ocupa el 70 % del alto:
    grande sin quedar apretado contra los bordes.
  · 400 px para el maskable. Android recorta el icono a formas distintas
    según el lanzador y solo garantiza el círculo central del 80 %, así
    que necesita más aire. Con 400 px los extremos del barco —tope del
    palo, proa y popa— quedan entre el 22 % y el 26 % del radio, con el
    límite en el 40 %.

Si cambias la foto, vuelve a medir MEDIDAS: el resto sale solo.
"""
from PIL import Image, ImageEnhance, ImageFilter
from pathlib import Path

RAIZ = Path(__file__).resolve().parent
FOTO = RAIZ / "barco.jpg"
SALIDA = RAIZ.parent / "icons"

# medido sobre barco.jpg
CENTRO = (866, 899)          # centro del barco, en píxeles de la foto
ALTO_BARCO = 207
LADO_NORMAL = 296            # barco al 70 % del alto
LADO_MASKABLE = 400          # barco al 52 %, holgado para el recorte de Android


def recorte(foto, lado):
    cx, cy = CENTRO
    return foto.crop((cx - lado // 2, cy - lado // 2,
                      cx + lado // 2, cy + lado // 2))


def realzar(im, nitidez):
    """La foto viene blanda a este zoom: algo de color, contraste y filo.
    Comprobado que el azul del mar no se desvía del original."""
    im = ImageEnhance.Color(im).enhance(1.12)
    im = ImageEnhance.Contrast(im).enhance(1.10)
    return im.filter(ImageFilter.UnsharpMask(radius=2, percent=nitidez, threshold=2))


def guardar(im, nombre):
    """PNG de 8 bits: una foto de mar se queda en 256 tonos con una diferencia
    media de 1,8 sobre 255, sin banding apreciable, y pesa la mitad. Importa
    porque la app tiene que cargar los iconos sin cobertura."""
    destino = SALIDA / nombre
    (im.quantize(colors=256, method=Image.MEDIANCUT, dither=Image.FLOYDSTEINBERG)
       .save(destino, optimize=True))
    print(f"{nombre:24} {im.size[0]}x{im.size[1]}  "
          f"{destino.stat().st_size / 1024:5.0f} KB")


def main():
    foto = Image.open(FOTO).convert("RGB")
    SALIDA.mkdir(exist_ok=True)

    normal = recorte(foto, LADO_NORMAL)
    # el de 192 lleva más filo: se ve a un tercio de tamaño
    guardar(realzar(normal.resize((512, 512), Image.LANCZOS), 70), "icon-512.png")
    guardar(realzar(normal.resize((192, 192), Image.LANCZOS), 110), "icon-192.png")

    # el maskable va a sangre, sin rellenos: probé a espejar un borde para
    # ganar margen y duplicaba un reflejo del mar en una mancha simétrica
    # bien visible en la esquina
    ancho = recorte(foto, LADO_MASKABLE)
    guardar(realzar(ancho.resize((512, 512), Image.LANCZOS), 70), "icon-maskable-512.png")

    print(f"\nbarco = {100 * ALTO_BARCO / LADO_NORMAL:.0f} % del alto en los normales, "
          f"{100 * ALTO_BARCO / LADO_MASKABLE:.0f} % en el maskable")
    print("Recuerda subir VER en sw.js: si no, los iconos cacheados no se renuevan.")


if __name__ == "__main__":
    main()
