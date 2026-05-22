# Evolución física PDF biométrico - fix centrado final

## Problema detectado
La silueta inicial del PDF todavía podía verse:
- un poco corrida hacia la izquierda;
- ligeramente flotando sobre la plataforma;
- con proporción distinta a la del panel derecho.

Esto ocurría porque los PNG de siluetas no compartían exactamente los mismos márgenes transparentes, y el render del PDF los trataba como si ocuparan el mismo bounding box real.

## Solución aplicada
Se corrigió el pipeline visual del PDF:

1. recorte automático de transparencia en los PNG biométricos;
2. conservación de proporción natural al calcular ancho y alto;
3. alineación inferior sobre la plataforma;
4. leve aumento de escala para acercar más la altura visual entre estados.

## Resultado esperado
- La silueta ANTES queda más centrada.
- Deja de verse flotando.
- Mantiene el volumen corporal correcto para estados soft/robustos.
- Se acerca visualmente a la altura y presencia de la silueta AHORA, sin deformarse.
