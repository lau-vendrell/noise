# Noise Field Particles

Visualizador interactivo de partículas en Canvas 2D que siguen un campo de ruido 2D+tiempo.

## Ejecutar

```bash
npm install
npm run dev
```

## Controles

- `particleCount`: cantidad de partículas (2.000 a 10.000)
- `speed`: velocidad de avance
- `noiseScale`: escala espacial del campo
- `noiseStrength`: intensidad angular del ruido
- `turbulence`: octavas del ruido fractal
- `trail`: persistencia de estela (0 sin estela, 1 estela larga)
- `New Seed`: randomiza semilla
- `Pause/Play`: pausa o reanuda
- `Reset`: reinicia posiciones

Atajos:

- `Space`: pause/play
- `R`: reset
- `S`: nueva seed
- `H`: ocultar/mostrar panel

Los ajustes se guardan automáticamente en `localStorage`.
