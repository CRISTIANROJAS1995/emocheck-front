# Paleta de Colores — Emocheck

Referencia extraída de `src/app/shared/design-tokens/colors.ts`, `tailwind.config.js` y archivos SCSS del proyecto.

---

## Colores Primarios (Brand)

| Token | Descripción | Hex |
|---|---|---|
| `primary.green` | Verde principal — botones primarios, badges activos | `#7CCF00` |
| `primary.greenDark` | Verde oscuro — hover botón primario, gradientes | `#5EA500` |
| `primary.greenLight` | Verde claro — variante luminosa, fondos degradados | `#9AE600` |
| `primary.teal` | Teal principal — botones secundarios, iconos activos | `#00BBA7` |
| `primary.tealDark` | Teal oscuro — hover teal, gradiente secundario | `#009689` |
| `primary.tealLight` | Teal claro — hover suave, variante luminosa | `#00D5BE` |
| `primary.blue` | Azul principal — botones terciarios, links | `#2B7FFF` |
| `primary.blueDark` | Azul oscuro — hover azul, gradiente terciario | `#155DFC` |

---

## Texto

| Token | Descripción | Hex |
|---|---|---|
| `text.primary` | Negro casi puro — títulos y cuerpo principal | `#0A0A0A` |
| `text.secondary` | Gris azulado — subtítulos, labels | `#4A5565` |
| `text.tertiary` | Gris oscuro — texto de apoyo | `#2D3748` |
| `text.white` | Blanco — texto sobre fondos oscuros | `#FFFFFF` |

---

## Bordes

| Token | Descripción | Hex |
|---|---|---|
| `border.teal` | Borde teal suave | `#96F7E4` |
| `border.gray` | Borde gris neutro — cards, inputs | `#E5E7EB` |
| `border.green` | Borde verde suave | `#D8F999` |

---

## Fondos

| Token | Descripción | Hex |
|---|---|---|
| `background.gray` | Fondo gris neutro — páginas, secciones | `#F3F3F5` |
| `background.greenLight` | Fondo verde muy claro — secciones destacadas | `#F7FEE7` |
| `background.blueLight` | Fondo azul muy claro — info boxes | `#EBF5FF` |
| `background.tealLight` | Fondo teal muy claro — secciones bienestar | `#F0FDFA` |

---

## Gradientes

| Token | Descripción | Valor |
|---|---|---|
| `gradients.primaryButton` | Botón verde principal | `linear-gradient(90deg, #7CCF00 0%, #5EA500 100%)` |
| `gradients.secondaryButton` | Botón teal secundario | `linear-gradient(90deg, #00BBA7 0%, #009689 100%)` |
| `gradients.tertiaryButton` | Botón azul terciario | `linear-gradient(90deg, #2B7FFF 0%, #155DFC 100%)` |
| `gradients.greenCard` | Card verde | `linear-gradient(135deg, #9AE600 0%, #7CCF00 100%)` |
| `gradients.blueCard` | Card azul | `linear-gradient(135deg, #2B7FFF 0%, #155DFC 100%)` |
| `gradients.tealCard` | Card teal | `linear-gradient(135deg, #00BBA7 0%, #009689 100%)` |
| `gradients.pageBackground` | Fondo de página | `linear-gradient(135deg, #EFF6FF 0%, #FFF 50%, #F0FDFA 100%)` |
| `gradients.homeBackground` | Fondo del home | `linear-gradient(180deg, #F0FDF4 0%, #FEFEFE 40%, #F0FDFA 100%)` |
| `gradients.banner` | Banner principal | `linear-gradient(90deg, #00BBA7 0%, #009689 45%, #155DFC 100%)` |

---

## Módulos (color de acento por módulo)

| Módulo | Color | Hex |
|---|---|---|
| Salud Mental | Azul | `#155DFC` |
| Fatiga Laboral | Teal | `#00BBA7` |
| Riesgo Psicosocial | Rojo | `#DC2626` |
| Clima Organizacional | Violeta | `#7C3AED` |

---

## Estados / Semáforo

| Estado | Fondo | Texto |
|---|---|---|
| Verde — Activo / Bien | `#dcfce7` | `#15803d` |
| Amarillo — Atención | `#fef9c3` | `#a16207` |
| Rojo — Alerta / Inactivo | `#fee2e2` | `#b91c1c` |
| Gris — Sin datos | `#f1f5f9` | `#94a3b8` |

---

## Navegación / Sidebar

| Uso | Hex |
|---|---|
| Hover estándar (teal) | `#1C887F` |
| Hover especial — verde lima | `#A2BF77` |
| Hover azul — rol admin / psicólogo | `#3B82F6` |

---

## Colores UI generales (Tailwind / SCSS)

| Rol | Descripción | Hex |
|---|---|---|
| Sky blue | Textos decorativos, chips | `#0ea5e9` |
| Slate 900 | Texto oscuro principal | `#1e293b` |
| Slate 600 | Texto secundario | `#475569` |
| Slate 500 | Muted / paginador | `#64748b` |
| Slate 400 | Placeholder / empty state | `#94a3b8` |
| Blue 500 | KPI cards, focus border | `#3b82f6` |
| Green 500 | KPI cards, badge activo | `#22c55e` |
| Teal 500 | KPI cards teal | `#14b8a6` |
| Red 500 | KPI cards, badges error | `#ef4444` |
| Amber 500 | Badge atención / warning | `#f59e0b` |
| Slate 100 | Fondo de tabla (header) | `#f1f5f9` |
| Slate 50 | Fondo de filas hover | `#f8fafc` |
| Slate 200 | Bordes de tabla / inputs | `#e2e8f0` |
| Sky 50 | Fondo fila seleccionada | `#f0f9ff` |
