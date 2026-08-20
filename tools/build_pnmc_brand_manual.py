from pathlib import Path
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor, Color, white, black
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase import pdfmetrics
from reportlab.lib.utils import ImageReader
from PIL import Image
import math

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "docs/marca/pdf/Manual_de_Marca_PNMC_2025-2035.pdf"
PREV = ROOT / "tmp/pdfs/source-previews"
ASSETS = ROOT / "docs/marca/assets"

W, H = 960, 540
PURPLE = HexColor("#291242")
VIOLET = HexColor("#6100D7")
GREEN = HexColor("#00DA5E")
LIME = HexColor("#8BF784")
MIST = HexColor("#E6DAE5")
INK = HexColor("#211A2A")
GRAY = HexColor("#6E6872")
LIGHT = HexColor("#F6F2F6")
WHITE = white

pdfmetrics.registerFont(TTFont("Arial", "/System/Library/Fonts/Supplemental/Arial.ttf"))
pdfmetrics.registerFont(TTFont("Arial-Bold", "/System/Library/Fonts/Supplemental/Arial Bold.ttf"))
pdfmetrics.registerFont(TTFont("Arial-Narrow", "/System/Library/Fonts/Supplemental/Arial Narrow.ttf"))
pdfmetrics.registerFont(TTFont("Arial-Narrow-Bold", "/System/Library/Fonts/Supplemental/Arial Narrow Bold.ttf"))

def rr(c, x, y, w, h, r, fill, stroke=None, sw=1):
    c.setLineWidth(sw)
    c.setFillColor(fill)
    if stroke:
        c.setStrokeColor(stroke)
    else:
        c.setStrokeColor(fill)
    c.roundRect(x, y, w, h, r, fill=1, stroke=1 if stroke else 0)

def txt(c, text, x, y, size=12, color=INK, font="Arial", maxw=None, leading=None, align="left"):
    c.setFillColor(color); c.setFont(font, size)
    if not maxw:
        getattr(c, {"left":"drawString", "center":"drawCentredString", "right":"drawRightString"}[align])(x, y, text)
        return y
    words = text.split(); lines=[]; line=""
    for word in words:
        probe=(line+" "+word).strip()
        if pdfmetrics.stringWidth(probe,font,size) <= maxw: line=probe
        else:
            if line: lines.append(line)
            line=word
    if line: lines.append(line)
    lead=leading or size*1.28
    for i,line in enumerate(lines):
        yy=y-i*lead
        if align=="center": c.drawCentredString(x,yy,line)
        elif align=="right": c.drawRightString(x,yy,line)
        else: c.drawString(x,yy,line)
    return y-len(lines)*lead

def label(c, text, x, y, color=GREEN):
    c.setFillColor(color); c.setFont("Arial-Bold", 8.5); c.drawString(x,y,text.upper())

def footer(c, n, section, dark=False):
    col = MIST if dark else GRAY
    c.setStrokeColor(Color(col.red,col.green,col.blue,alpha=.45)); c.setLineWidth(.6); c.line(52,30,908,30)
    txt(c, "PLAN NACIONAL DE MÚSICA PARA LA CONVIVENCIA", 52, 16, 7.2, col, "Arial-Bold")
    txt(c, section.upper(), 480, 16, 7.2, col, "Arial", align="center")
    txt(c, f"{n:02}", 908, 16, 7.2, col, "Arial-Bold", align="right")

def title(c, n, kicker, heading, intro=None, dark=False):
    bg = PURPLE if dark else LIGHT
    c.setFillColor(bg); c.rect(0,0,W,H,fill=1,stroke=0)
    label(c,kicker,52,486,GREEN if dark else VIOLET)
    yy=450
    yy=txt(c,heading.upper(),52,yy,27,WHITE if dark else PURPLE,"Arial-Narrow-Bold",maxw=650,leading=27)
    if intro: txt(c,intro,52,yy-10,11.5,MIST if dark else GRAY,"Arial",maxw=650,leading=15)
    footer(c,n,kicker,dark)

def draw_logo(c, path, x, y, w, h, preserve=True):
    p=Path(path)
    if not p.exists(): return
    c.drawImage(ImageReader(str(p)),x,y,width=w,height=h,preserveAspectRatio=preserve,mask='auto',anchor='c')

def dot_rule(c,x,y,h,color=PURPLE):
    c.setStrokeColor(color); c.setFillColor(color); c.setLineWidth(1)
    c.line(x,y,x,y+h); c.circle(x,y,3,fill=1,stroke=0); c.circle(x,y+h,3,fill=1,stroke=0)

def chip(c,x,y,w,text,fill=WHITE,color=PURPLE):
    rr(c,x,y,w,24,8,fill)
    txt(c,text,x+w/2,y+8,8.5,color,"Arial-Bold",align="center")

def page_cover(c,n):
    c.setFillColor(PURPLE); c.rect(0,0,W,H,fill=1,stroke=0)
    for i,r in enumerate([185,145,105]):
        c.setStrokeColor(Color(GREEN.red,GREEN.green,GREEN.blue,alpha=.13+i*.08)); c.setLineWidth(18)
        c.arc(30-r,160-r,30+r,160+r,10,300)
    draw_logo(c, ASSETS/"firma-pnmc-vigente.png", 505,245,405,225)
    label(c,"MANUAL DE IDENTIDAD",54,454,GREEN)
    txt(c,"PLAN NACIONAL",54,410,35,WHITE,"Arial-Narrow-Bold")
    txt(c,"DE MÚSICA PARA",54,373,35,WHITE,"Arial-Narrow-Bold")
    txt(c,"LA CONVIVENCIA",54,336,35,WHITE,"Arial-Narrow-Bold")
    txt(c,"Sistema de marca 2025-2035",54,286,15,LIME,"Arial")
    txt(c,"Versión integral · julio de 2026",54,262,10.5,MIST,"Arial")
    dot_rule(c,470,110,330,MIST)
    txt(c,"HUELLAS Y APUESTAS",710,110,14,GREEN,"Arial-Narrow-Bold",align="center")
    txt(c,"DE LA DIVERSIDAD SONORA",710,91,14,GREEN,"Arial-Narrow-Bold",align="center")
    footer(c,n,"portada",True)

def page_scope(c,n):
    title(c,n,"Introducción","Un sistema para sonar con una sola voz","Este manual reúne las reglas esenciales para que el PNMC se reconozca con claridad en cualquier territorio, formato o alianza.")
    cards=[("PROPÓSITO","Orientar decisiones de diseño, redacción, producción y aprobación."),("ALCANCE","Comunicación institucional, territorial, pedagógica, editorial, digital y audiovisual."),("PRINCIPIO RECTOR","La diversidad sonora se expresa con energía, rigor, accesibilidad y respeto por las comunidades.")]
    x=52
    for i,(a,b) in enumerate(cards):
        rr(c,x,160,260,142,15,WHITE,HexColor("#DED5E1")); label(c,a,x+18,272,VIOLET); txt(c,b,x+18,244,13,PURPLE,"Arial-Bold",maxw=220,leading=17); x+=286
    txt(c,"Este documento amplía el manual gráfico PNMC de 2025 y adopta como marco de compatibilidad las orientaciones institucionales de MinCulturas.",52,108,9.5,GRAY,"Arial",maxw=730)

def page_contents(c,n):
    title(c,n,"Navegación","Contenido")
    items=[("01","Fundamentos","04-09"),("02","Identidad visual","10-20"),("03","Sistema expresivo","21-25"),("04","Aplicaciones","26-31"),("05","Gestión y control","32-36")]
    y=385
    for num,name,pages in items:
        c.setStrokeColor(HexColor("#D9CFDD")); c.line(52,y-12,908,y-12)
        txt(c,num,52,y,13,GREEN,"Arial-Bold"); txt(c,name,108,y,17,PURPLE,"Arial-Narrow-Bold"); txt(c,pages,908,y,10,GRAY,"Arial-Bold",align="right"); y-=62

def page_essence(c,n):
    title(c,n,"Fundamentos","Esencia de marca","El PNMC conecta prácticas, memorias y futuros musicales para fortalecer la convivencia.")
    rr(c,52,122,535,250,18,PURPLE)
    txt(c,"LA MÚSICA",82,318,31,WHITE,"Arial-Narrow-Bold")
    txt(c,"COMO TERRITORIO",82,282,31,WHITE,"Arial-Narrow-Bold")
    txt(c,"DE ENCUENTRO",82,246,31,GREEN,"Arial-Narrow-Bold")
    txt(c,"Una marca pública, colectiva y dinámica, capaz de representar múltiples formas de escuchar, crear, aprender y convivir.",82,196,11.5,MIST,"Arial",maxw=430,leading=15)
    vals=[("DIVERSIDAD","Reconoce muchas músicas y maneras de habitar el territorio."),("CONVIVENCIA","Promueve vínculos, cuidado y transformación colectiva."),("MEMORIA + FUTURO","Conecta saberes heredados con nuevas prácticas y tecnologías.")]
    y=345
    for a,b in vals:
        label(c,a,624,y,VIOLET); y=txt(c,b,624,y-24,10.5,INK,"Arial",maxw=270,leading=14)-24

def page_position(c,n):
    title(c,n,"Fundamentos","Posicionamiento y promesa")
    txt(c,"PARA",52,382,10,VIOLET,"Arial-Bold"); txt(c,"personas, comunidades, escuelas, organizaciones e instituciones que hacen de la música una práctica viva",52,352,17,PURPLE,"Arial-Bold",maxw=780,leading=22)
    txt(c,"EL PNMC ES",52,282,10,VIOLET,"Arial-Bold"); txt(c,"una plataforma pública que articula capacidades, memorias y oportunidades musicales en los territorios",52,252,17,PURPLE,"Arial-Bold",maxw=780,leading=22)
    txt(c,"PORQUE",52,182,10,VIOLET,"Arial-Bold"); txt(c,"entiende la diversidad sonora como una fuerza para la convivencia, la participación y la construcción de país",52,152,17,PURPLE,"Arial-Bold",maxw=780,leading=22)

def page_principles(c,n):
    title(c,n,"Fundamentos","Principios de expresión")
    data=[("01","PLURAL","Incluye voces, géneros, prácticas y territorios sin convertir la diversidad en decoración."),("02","CERCANA","Habla con claridad, humanidad y respeto; evita la distancia burocrática."),("03","VIBRANTE","Usa ritmo, contraste y energía con intención; no confunde vitalidad con saturación."),("04","PEDAGÓGICA","Explica, orienta y facilita la participación."),("05","RIGUROSA","Protege datos, créditos, derechos, legibilidad y coherencia institucional."),("06","COLECTIVA","Da protagonismo a comunidades, procesos y alianzas.")]
    for i,(num,a,b) in enumerate(data):
        col=i%3; row=i//3; x=52+col*290; y=348-row*160
        txt(c,num,x,y+40,10,GREEN,"Arial-Bold"); txt(c,a,x,y+13,17,PURPLE,"Arial-Narrow-Bold"); txt(c,b,x,y-14,9.8,GRAY,"Arial",maxw=250,leading=13)

def page_audiences(c,n):
    title(c,n,"Fundamentos","Públicos y contextos")
    data=[("COMUNIDADES MUSICALES","Procesos locales, agrupaciones, formadores, estudiantes y portadores de saber."),("CIUDADANÍA","Personas que encuentran en la música experiencias, derechos culturales y vínculos."),("INSTITUCIONES Y ALIADOS","Entidades públicas, academia, cooperación, sector cultural y organizaciones sociales."),("EQUIPOS DE COMUNICACIÓN","Personas que producen, adaptan, publican y custodian la marca.")]
    for i,(a,b) in enumerate(data):
        x=52+(i%2)*430; y=340-(i//2)*150
        rr(c,x,y,395,115,14,WHITE,HexColor("#DDD3E0")); label(c,a,x+18,y+83,VIOLET); txt(c,b,x+18,y+56,10.5,GRAY,"Arial",maxw=350,leading=14)

def page_voice(c,n):
    title(c,n,"Fundamentos","Identidad verbal","Una voz que sabe escuchar antes de hablar.")
    axes=[("INSPIRADORA","Activa posibilidades reales; evita promesas grandilocuentes."),("EMOTIVA","Conecta con experiencias y afectos; evita sentimentalismos vacíos."),("CONTUNDENTE","Presenta la idea principal con claridad; evita tecnicismos innecesarios."),("SABIA + POPULAR","Integra saber experto y lenguaje cotidiano sin apropiarse de voces ajenas.")]
    y=360
    for a,b in axes:
        c.setFillColor(GREEN); c.circle(70,y+4,6,fill=1,stroke=0); txt(c,a,94,y,15,PURPLE,"Arial-Narrow-Bold"); txt(c,b,270,y,10.5,GRAY,"Arial",maxw=610,leading=14); y-=72

def page_writing(c,n):
    title(c,n,"Fundamentos","Cómo escribir para el PNMC")
    rr(c,52,145,398,245,18,WHITE,HexColor("#D9CFDD")); rr(c,510,145,398,245,18,PURPLE)
    label(c,"SÍ",78,354,GREEN); label(c,"EVITAR",536,354,LIME)
    yes=["Titulares breves con un verbo claro.","Nombrar personas, comunidades y territorios con precisión.","Explicar fechas, lugares y pasos de participación.","Usar lenguaje incluyente, comprensible y verificable."]
    no=["Folclorizar o exotizar prácticas culturales.","Usar jerga territorial sin validación comunitaria.","Hablar de ‘beneficiarios’ cuando corresponde ‘participantes’ o ‘comunidades’.","Abusar de mayúsculas, signos o hashtags."]
    for i,s in enumerate(yes): txt(c,"• "+s,78,316-i*45,10.5,INK,"Arial",maxw=330,leading=14)
    for i,s in enumerate(no): txt(c,"• "+s,536,316-i*45,10.5,WHITE,"Arial",maxw=330,leading=14)

def page_architecture(c,n):
    title(c,n,"Identidad visual","Arquitectura de marca")
    rr(c,52,325,856,76,14,PURPLE); txt(c,"MINISTERIO DE LAS CULTURAS, LAS ARTES Y LOS SABERES",480,354,14,WHITE,"Arial-Bold",align="center")
    c.setStrokeColor(VIOLET); c.setLineWidth(2); c.line(480,325,480,282); c.line(190,282,770,282)
    for x,labeltxt in [(190,"MARCA INSTITUCIONAL"),(480,"PLAN NACIONAL DE MÚSICA"),(770,"ALIADOS / TERRITORIOS")]:
        c.line(x,282,x,246); rr(c,x-120,185,240,61,12,WHITE,HexColor("#D7CCD9")); txt(c,labeltxt,x,210,9.5,PURPLE,"Arial-Bold",align="center")
    txt(c,"Regla: la firma PNMC identifica el programa; MinCulturas asegura la atribución institucional; los aliados se incorporan sin alterar ninguna marca.",52,115,10.5,GRAY,"Arial",maxw=800)

def page_signature(c,n):
    title(c,n,"Identidad visual","Firma principal","Es la versión prioritaria para portadas, cierres, fondos controlados y piezas de posicionamiento.")
    rr(c,52,120,856,255,18,PURPLE)
    draw_logo(c,ASSETS/"firma-pnmc-vigente.png",165,145,650,210)
    txt(c,"Preferir fondos morado profundo, verde principal o neutro claro, según la versión disponible.",480,95,9.5,GRAY,"Arial",align="center")

def page_legacy(c,n):
    title(c,n,"Identidad visual","Identificador de legado","El símbolo de huellas conserva valor histórico. Su uso debe ser deliberado y no sustituye la firma 2025-2035.")
    rr(c,52,135,856,225,18,WHITE,HexColor("#D9CFDD"))
    draw_logo(c,ASSETS/"logo-pnmc-horizontal.png",92,180,776,155)
    chip(c,110,104,210,"ARCHIVO / MEMORIA",PURPLE,WHITE); chip(c,375,104,210,"PIEZAS HISTÓRICAS",MIST,PURPLE); chip(c,640,104,210,"NO COEXISTIR COMO LOGO",GREEN,PURPLE)

def page_versions(c,n):
    title(c,n,"Identidad visual","Versiones cromáticas")
    boxes=[(52,270,PURPLE,"FIRMA VIGENTE · REFERENCIA",ASSETS/"firma-pnmc-vigente.png"),(480,270,GREEN,"POSITIVO SOBRE VERDE · MAESTRO REQUERIDO",None),(52,85,WHITE,"MONOCROMO OSCURO · MAESTRO REQUERIDO",None),(480,85,INK,"MONOCROMO CLARO · MAESTRO REQUERIDO",None)]
    for x,y,bg,lab,p in boxes:
        rr(c,x,y,428,150,12,bg,HexColor("#D9CFDD") if bg==WHITE else bg)
        if p:
            draw_logo(c,p,x+55,y+38,318,90)
        else:
            txt(c,"PNMC",x+214,y+82,23,WHITE if bg==INK else PURPLE,"Arial-Narrow-Bold",align="center")
        txt(c,lab,x+14,y+12,7.5,GRAY if bg==WHITE else (MIST if bg in [PURPLE,INK] else PURPLE),"Arial-Bold")

def page_clearspace(c,n):
    title(c,n,"Identidad visual","Área de reserva","Mantener un perímetro libre protege reconocimiento, lectura y jerarquía.")
    rr(c,155,120,650,260,16,MIST,HexColor("#BDAFC2"),1)
    rr(c,215,170,530,160,8,PURPLE)
    draw_logo(c,ASSETS/"firma-pnmc-vigente.png",275,185,410,130)
    for (x1,y1,x2,y2,t) in [(155,400,215,400,"x"),(805,400,745,400,"x"),(135,120,135,170,"x"),(825,380,825,330,"x")]:
        c.setStrokeColor(VIOLET); c.setLineWidth(1.3); c.line(x1,y1,x2,y2); txt(c,t,(x1+x2)/2,(y1+y2)/2+6,10,VIOLET,"Arial-Bold",align="center")
    txt(c,"Unidad x recomendada: altura de una línea del nombre o, cuando no sea posible medirla, mínimo 10 % del ancho total de la firma.",52,86,9.5,GRAY,"Arial",maxw=820)

def page_size(c,n):
    title(c,n,"Identidad visual","Tamaño mínimo y legibilidad")
    data=[("IMPRESO","Firma completa","35 mm de ancho"),("DIGITAL","Firma completa","180 px de ancho"),("SÍMBOLO","Uso excepcional","12 mm / 48 px"),("FAVICON","Solo símbolo simplificado","32 px o superior")]
    y=358
    for i,(a,b,d) in enumerate(data):
        x=52+(i%2)*430; yy=y-(i//2)*145
        rr(c,x,yy,395,102,14,WHITE,HexColor("#D9CFDD")); label(c,a,x+18,yy+72,VIOLET); txt(c,b,x+18,yy+45,11,INK,"Arial-Bold"); txt(c,d,x+377,yy+45,11,GREEN,"Arial-Bold",align="right")
    txt(c,"Si el descriptor pierde legibilidad, aumente el tamaño o use una composición aprobada. Nunca reconstruya el nombre con otra tipografía.",52,96,10,GRAY,"Arial",maxw=780)

def page_backgrounds(c,n):
    title(c,n,"Identidad visual","Fondos y contraste")
    panels=[(52,PURPLE,WHITE,"ÓPTIMO"),(266,GREEN,PURPLE,"ÓPTIMO"),(480,MIST,PURPLE,"ÓPTIMO"),(694,VIOLET,WHITE,"CONDICIONAL")]
    for x,bg,fg,lab in panels:
        rr(c,x,150,190,230,14,bg); c.setFillColor(fg); c.circle(x+95,275,46,fill=0,stroke=1); txt(c,"PNMC",x+95,208,18,fg,"Arial-Narrow-Bold",align="center"); txt(c,lab,x+95,170,8,fg,"Arial-Bold",align="center")
    txt(c,"Sobre fotografía, coloque la firma en un área limpia o use una placa de color sólido. No aplique sombras, contornos ni transparencias para ‘rescatar’ contraste.",52,104,10,GRAY,"Arial",maxw=820)

def page_misuse(c,n):
    title(c,n,"Identidad visual","Usos incorrectos")
    bad=["Deformar, inclinar o rotar","Cambiar proporciones o separación","Recolorear fuera de la paleta","Aplicar sombras, brillos o contornos","Usar sobre fondos sin contraste","Recrear o sustituir la tipografía","Encerrar en formas no previstas","Combinar firma vigente y logo de legado"]
    for i,s in enumerate(bad):
        x=52+(i%4)*214; y=325-(i//4)*140
        rr(c,x,y,190,95,12,WHITE,HexColor("#E0D7E2")); txt(c,"×",x+18,y+54,24,HexColor("#B32442"),"Arial-Bold"); txt(c,s,x+48,y+58,9.5,PURPLE,"Arial-Bold",maxw=125,leading=12)

def page_palette(c,n):
    title(c,n,"Identidad visual","Paleta cromática PNMC")
    cols=[("VERDE LUZ","#8BF784","139 · 247 · 132","47 · 0 · 66 · 0"),("VERDE PRINCIPAL","#00DA5E","0 · 218 · 94","69 · 0 · 82 · 0"),("VIOLETA","#6100D7","97 · 0 · 215","84 · 83 · 0 · 0"),("MORADO PROFUNDO","#291242","41 · 18 · 66","96 · 100 · 38 · 45"),("NIEBLA","#E6DAE5","230 · 218 · 229","11 · 16 · 5 · 0")]
    x=52
    for name,hx,rgb,cmyk in cols:
        rr(c,x,145,162,255,12,WHITE,HexColor("#D8CEDB")); c.setFillColor(HexColor(hx)); c.rect(x,255,162,145,fill=1,stroke=0); txt(c,name,x+12,230,8,PURPLE,"Arial-Bold",maxw=138); txt(c,hx,x+12,205,12,INK,"Arial-Bold"); txt(c,"RGB  "+rgb,x+12,180,7.5,GRAY,"Arial"); txt(c,"CMYK "+cmyk,x+12,160,7.5,GRAY,"Arial"); x+=174

def luminance(hexv):
    rgb=[int(hexv[i:i+2],16)/255 for i in (1,3,5)]
    return sum(w*(v/12.92 if v<=.03928 else ((v+.055)/1.055)**2.4) for v,w in zip(rgb,[.2126,.7152,.0722]))
def ratio(a,b):
    l1,l2=sorted([luminance(a),luminance(b)],reverse=True); return (l1+.05)/(l2+.05)

def page_contrast(c,n):
    title(c,n,"Identidad visual","Contraste y accesibilidad","La energía visual debe conservar lectura suficiente en pantallas, impresos y espacios.")
    pairs=[("#291242","#FFFFFF"),("#00DA5E","#291242"),("#E6DAE5","#291242"),("#6100D7","#FFFFFF"),("#8BF784","#291242"),("#00DA5E","#FFFFFF")]
    y=360
    for i,(bg,fg) in enumerate(pairs):
        x=52+(i%3)*290; yy=y-(i//3)*135; r=ratio(bg,fg); ok=r>=4.5
        rr(c,x,yy,260,92,12,HexColor(bg)); txt(c,"Aa",x+22,yy+38,28,HexColor(fg),"Arial-Bold"); txt(c,f"{r:.2f}:1",x+238,yy+52,10,HexColor(fg),"Arial-Bold",align="right"); txt(c,"AA texto" if ok else "Solo texto grande / gráfico",x+238,yy+29,8,HexColor(fg),"Arial",align="right")
    txt(c,"Criterio operativo: 4,5:1 para texto normal; 3:1 para texto grande y elementos esenciales. Verifique cada fotografía y cada combinación real.",52,94,9.8,GRAY,"Arial",maxw=820)

def page_color_roles(c,n):
    title(c,n,"Identidad visual","Roles y proporción del color")
    c.setFillColor(MIST); c.rect(52,286,856,95,fill=1,stroke=0); c.setFillColor(PURPLE); c.rect(52,286,428,95,fill=1,stroke=0); c.setFillColor(GREEN); c.rect(480,286,257,95,fill=1,stroke=0); c.setFillColor(VIOLET); c.rect(737,286,103,95,fill=1,stroke=0); c.setFillColor(LIME); c.rect(840,286,68,95,fill=1,stroke=0)
    roles=[("50 %","MORADO / NIEBLA","Base y espacio"),("30 %","VERDE PRINCIPAL","Acción y energía"),("12 %","VIOLETA","Profundidad y acento"),("8 %","VERDE LUZ","Destacado puntual")]
    x=52
    for pct,a,b in roles:
        txt(c,pct,x,236,18,PURPLE,"Arial-Narrow-Bold"); txt(c,a,x,211,8,VIOLET,"Arial-Bold"); txt(c,b,x,189,9,GRAY,"Arial"); x+=214
    txt(c,"La proporción es orientativa. En cada pieza, elija un color dominante, uno de soporte y un acento. Evite usar los cinco con el mismo peso.",52,112,10,GRAY,"Arial",maxw=820)

def page_type(c,n):
    title(c,n,"Identidad visual","Sistema tipográfico")
    txt(c,"TITULARES",52,375,8.5,VIOLET,"Arial-Bold"); txt(c,"ALTERNATE GOTHIC / CONDENSADA",52,334,31,PURPLE,"Arial-Narrow-Bold")
    txt(c,"CUERPO Y DATOS",52,270,8.5,VIOLET,"Arial-Bold"); txt(c,"Nunito Sans",52,228,27,PURPLE,"Arial-Bold"); txt(c,"Sustitución segura: Arial para documentos ofimáticos y plataformas donde Nunito Sans no esté disponible.",52,198,10,GRAY,"Arial",maxw=640)
    txt(c,"ACENTO HEREDADO MINCULTURAS",52,150,8.5,VIOLET,"Arial-Bold"); txt(c,"Gregor",52,112,25,PURPLE,"Arial-Bold"); txt(c,"Solo cuando la pieza pertenezca al sistema ‘Estamos con la Vida’ y exista el archivo autorizado.",190,119,9.5,GRAY,"Arial",maxw=620)

def page_hierarchy(c,n):
    title(c,n,"Identidad visual","Jerarquía tipográfica")
    specs=[("H1","32-56 pt","Condensada Bold","Titular principal, máximo 3 líneas"),("H2","20-30 pt","Condensada Bold","Secciones y llamados"),("H3","14-18 pt","Nunito/Arial Bold","Subtítulos y etiquetas"),("CUERPO","10-12 pt","Nunito/Arial Regular","Lectura continua"),("NOTA","8-9 pt","Nunito/Arial Regular","Créditos, fuentes y datos auxiliares")]
    y=370
    for code,size,font,use in specs:
        txt(c,code,52,y,10,GREEN,"Arial-Bold"); txt(c,size,135,y,10,PURPLE,"Arial-Bold"); txt(c,font,260,y,10,INK,"Arial"); txt(c,use,470,y,10,GRAY,"Arial",maxw=380); c.setStrokeColor(HexColor("#D8CFDB")); c.line(52,y-18,908,y-18); y-=58

def page_graphics(c,n):
    title(c,n,"Sistema expresivo","Recursos gráficos")
    items=[("RAYOS","Expansión, llamado, energía colectiva."),("CÍRCULOS / SELLOS","Pertenencia, foco, encuentro."),("TRAMAS","Textura, memoria, registro; nunca deben reducir legibilidad."),("LÍNEA CON PUNTOS","Conexión, recorrido, articulación."),("MARCOS REDONDEADOS","Contenedores para fotografía y datos."),("CORTES / GLITCH","Uso moderado en piezas juveniles o audiovisuales.")]
    for i,(a,b) in enumerate(items):
        x=52+(i%3)*290; y=335-(i//3)*145
        rr(c,x,y,260,110,14,WHITE,HexColor("#D9CFDD")); c.setFillColor(GREEN); c.circle(x+30,y+75,10,fill=1,stroke=0); label(c,a,x+54,y+79,VIOLET); txt(c,b,x+18,y+46,9.5,GRAY,"Arial",maxw=220,leading=12)

def page_photo(c,n):
    title(c,n,"Sistema expresivo","Dirección fotográfica")
    img=PREV/"pnmc-002.png"; draw_logo(c,img,52,135,475,280,True)
    rules=[("PROTAGONISMO","Personas y prácticas musicales en acción; miradas dignas, no posadas de forma artificial."),("TERRITORIO","Mostrar contexto, materialidades y relaciones, no fondos genéricos."),("DIVERSIDAD REAL","Evitar imágenes tokenizadas; representar procesos con créditos y consentimiento."),("TRATAMIENTO","Color pleno o bicromía verde-morado. Conservar pieles, detalle y contraste.")]
    y=380
    for a,b in rules:
        label(c,a,560,y,VIOLET); y=txt(c,b,560,y-22,9.8,GRAY,"Arial",maxw=330,leading=13)-22

def page_composition(c,n):
    title(c,n,"Sistema expresivo","Sistema de composición")
    rr(c,52,130,500,280,15,WHITE,HexColor("#CFC2D2")); c.setStrokeColor(HexColor("#D9CFDD"));
    for i in range(1,6): c.line(52+i*83.3,130,52+i*83.3,410)
    for i in range(1,4): c.line(52,130+i*70,552,130+i*70)
    c.setFillColor(PURPLE); c.rect(52,340,333,70,fill=1,stroke=0); c.setFillColor(GREEN); c.rect(385,130,167,210,fill=1,stroke=0)
    txt(c,"6 columnas",302,105,9,VIOLET,"Arial-Bold",align="center")
    rules=["Márgenes exteriores: 6-8 %.","Alinee texto, imágenes y firmas a la retícula.","Reserve 15-25 % de aire visual.","Un punto focal por pieza.","Máximo 4-5 colores por composición."]
    for i,s in enumerate(rules): txt(c,f"{i+1:02}  {s}",600,365-i*52,10.5,PURPLE if i<2 else GRAY,"Arial-Bold" if i<2 else "Arial")

def page_icon(c,n):
    title(c,n,"Sistema expresivo","Iconografía e ilustración")
    txt(c,"El sistema debe sentirse humano, modular y directo.",52,375,18,PURPLE,"Arial-Bold")
    rules=[("TRAZO","Grosor consistente; terminales redondeados."),("FORMA","Geometría simple inspirada en señales, instrumentos y movimientos."),("COLOR","Monocromo o máximo dos colores de la paleta."),("DETALLE","Evitar ornamento fino en tamaños pequeños."),("CULTURA","No copiar símbolos tradicionales sin contexto, autorización y crédito."),("ACCESIBILIDAD","Nunca depender solo del color para comunicar estado o acción.")]
    for i,(a,b) in enumerate(rules):
        x=52+(i%2)*430; y=305-(i//2)*75; label(c,a,x,y,VIOLET); txt(c,b,x+100,y,9.8,GRAY,"Arial",maxw=300,leading=12)

def page_cobrand(c,n):
    title(c,n,"Sistema expresivo","Co-branding y alianzas")
    rr(c,52,225,856,120,15,WHITE,HexColor("#D7CCD9")); txt(c,"MINCULTURAS",165,275,15,PURPLE,"Arial-Bold",align="center"); dot_rule(c,290,250,55,GRAY); txt(c,"PNMC",480,275,22,PURPLE,"Arial-Narrow-Bold",align="center"); dot_rule(c,670,250,55,GRAY); txt(c,"ALIADO(S)",795,275,15,GRAY,"Arial-Bold",align="center")
    notes=[("ORDEN","MinCulturas + PNMC + aliados, salvo convenio que establezca otra jerarquía."),("ALTURA","Equilibrar altura óptica, no ancho absoluto."),("SEPARACIÓN","Mínimo un área de reserva entre marcas."),("COLOR","Preferir versiones monocromas cuando las paletas compitan.")]
    for i,(a,b) in enumerate(notes):
        x=52+(i%2)*430; y=170-(i//2)*55; label(c,a,x,y,VIOLET); txt(c,b,x+90,y,9,GRAY,"Arial",maxw=300)

def page_social(c,n):
    title(c,n,"Aplicaciones","Redes sociales")
    draw_logo(c,PREV/"pnmc-005.png",52,120,500,300,True)
    specs=[("POST","1080 × 1080 px","Titular ≤ 8 palabras"),("STORY","1080 × 1920 px","Zona segura superior/inferior 250 px"),("REEL","1080 × 1920 px","Subtítulos siempre; primer mensaje en 2 s"),("CARRUSEL","1080 × 1350 px","Portada clara + secuencia numerada")]
    y=380
    for a,b,d in specs:
        label(c,a,590,y,VIOLET); txt(c,b,590,y-24,12,PURPLE,"Arial-Bold"); txt(c,d,590,y-44,9,GRAY,"Arial"); y-=73

def page_print(c,n):
    title(c,n,"Aplicaciones","Impresos y publicaciones")
    data=[("AFICHE","Titular, fecha, lugar, llamada y firmas visibles a distancia."),("PLEGABLE","Lectura secuencial; portada limpia; datos de contacto al cierre."),("INFORME","Portada institucional, jerarquía editorial, tablas accesibles, créditos y fuentes."),("PENDÓN","Una idea, pocos datos, alto contraste; validar lectura a 3-5 metros."),("MERCHANDISING","Validar técnica, sustrato, reducción, tintas y ubicación antes de producción."),("SEÑALÉTICA","Mensajes breves, pictogramas consistentes y contraste alto.")]
    for i,(a,b) in enumerate(data):
        x=52+(i%3)*290; y=335-(i//3)*145; rr(c,x,y,260,110,12,WHITE,HexColor("#D9CFDD")); label(c,a,x+18,y+78,VIOLET); txt(c,b,x+18,y+49,9.5,GRAY,"Arial",maxw=220,leading=12)

def page_presentation(c,n):
    title(c,n,"Aplicaciones","Presentaciones y documentos")
    rr(c,52,140,540,260,14,PURPLE); txt(c,"UNA IDEA",85,338,28,WHITE,"Arial-Narrow-Bold"); txt(c,"POR DIAPOSITIVA",85,307,28,GREEN,"Arial-Narrow-Bold"); txt(c,"Título 28-36 pt · cuerpo 18-24 pt",85,252,11,MIST,"Arial"); txt(c,"Datos con fuente y fecha · imágenes con crédito",85,224,11,MIST,"Arial"); txt(c,"Firma discreta en portada y cierre",85,196,11,MIST,"Arial")
    rules=[("DOCUMENTOS","Arial como sustitución segura; estilos reales; tablas con encabezados."),("ACCESIBILIDAD","Orden de lectura, texto alternativo, contraste y enlaces descriptivos."),("EXPORTACIÓN","PDF etiquetado cuando sea posible; fuentes incrustadas y revisión visual.")]
    y=365
    for a,b in rules: label(c,a,630,y,VIOLET); y=txt(c,b,630,y-24,9.8,GRAY,"Arial",maxw=260,leading=13)-35

def page_video(c,n):
    title(c,n,"Aplicaciones","Audiovisual y movimiento")
    phases=[("00-02 s","GANCHO","Idea o imagen principal"),("02-08 s","CONTEXTO","Quién, qué y dónde"),("08-25 s","DESARROLLO","Voces, proceso, impacto"),("CIERRE","ACCIÓN","Fecha, enlace, firma y créditos")]
    x=52
    for t,a,b in phases:
        rr(c,x,210,198,160,14,WHITE,HexColor("#D9CFDD")); label(c,t,x+16,338,VIOLET); txt(c,a,x+16,302,17,PURPLE,"Arial-Narrow-Bold"); txt(c,b,x+16,270,9.5,GRAY,"Arial",maxw=160,leading=12); x+=218
    txt(c,"Movimiento: entradas simples de 200-400 ms, ritmo vinculado al contenido y sin efectos que comprometan legibilidad. Incluir subtítulos, descripción sonora cuando aplique y autorización de música e imagen.",52,145,10,GRAY,"Arial",maxw=820)

def page_templates(c,n):
    title(c,n,"Aplicaciones","Plantillas mínimas del sistema")
    data=[("01","POST CUADRADO","Convocatoria / agenda"),("02","STORY / REEL","Anuncio / cobertura"),("03","CARRUSEL","Pedagogía / resultados"),("04","PRESENTACIÓN","Reuniones / formación"),("05","AFICHE","Circulación territorial"),("06","INFORME","Gestión / memoria"),("07","BOLETÍN","Actualización periódica"),("08","VIDEO","Testimonio / proceso")]
    for i,(num,a,b) in enumerate(data):
        x=52+(i%4)*214; y=330-(i//4)*125; rr(c,x,y,190,94,12,WHITE,HexColor("#D9CFDD")); txt(c,num,x+14,y+64,9,GREEN,"Arial-Bold"); txt(c,a,x+48,y+64,10,PURPLE,"Arial-Bold"); txt(c,b,x+48,y+40,8.5,GRAY,"Arial")

def page_process(c,n):
    title(c,n,"Gestión","Flujo de creación y aprobación")
    steps=[("01","BRIEF","Objetivo, público, canal, territorio, responsables."),("02","CONTENIDO","Mensaje, datos, fuentes, permisos y créditos."),("03","DISEÑO","Plantilla, jerarquía, imágenes, firmas y accesibilidad."),("04","REVISIÓN","Contenido + técnica + marca + enfoque cultural."),("05","SALIDA","Prueba, exportación, publicación y archivo maestro.")]
    x=52
    for i,(num,a,b) in enumerate(steps):
        rr(c,x,190,154,185,13,PURPLE if i==3 else WHITE,HexColor("#D9CFDD")); txt(c,num,x+16,338,9,GREEN,"Arial-Bold"); txt(c,a,x+16,306,14,WHITE if i==3 else PURPLE,"Arial-Narrow-Bold"); txt(c,b,x+16,272,9,MIST if i==3 else GRAY,"Arial",maxw=120,leading=12); x+=174

def page_check(c,n):
    title(c,n,"Gestión","Lista de control antes de publicar")
    checks=["La firma corresponde a la identidad vigente.","Se respetan área de reserva y tamaño mínimo.","El contraste permite leer textos y datos.","La jerarquía explica qué mirar primero.","Fechas, nombres, enlaces y cifras están verificados.","Fotografías, música e ilustraciones tienen permisos y créditos.","El lenguaje es claro, incluyente y respetuoso.","Las comunidades nombradas fueron consultadas cuando corresponde.","La pieza funciona en el tamaño y canal reales.","Se archivó el editable, la exportación y la versión aprobada."]
    for i,s in enumerate(checks):
        x=52+(i%2)*430; y=382-(i//2)*57; c.setStrokeColor(VIOLET); c.setLineWidth(1.2); c.rect(x,y-5,15,15,fill=0,stroke=1); txt(c,s,x+28,y,9.5,INK,"Arial",maxw=360,leading=12)

def page_assets(c,n):
    title(c,n,"Gestión","Paquete maestro de activos")
    rows=[("Logos","SVG / PDF / PNG","positivo, negativo, monocromo, símbolo"),("Color","ASE / PDF / JSON","HEX, RGB, CMYK y combinaciones"),("Tipografía","OTF / TTF + licencias","familias, pesos y sustituciones"),("Plantillas","PPTX / DOCX / AI / Figma","redes, presentaciones, informes, impresos"),("Fotografía","JPG / TIFF + ficha","autoría, consentimiento, territorio, fecha"),("Guía","PDF accesible","versión, fecha, responsable y cambios")]
    y=378
    txt(c,"ACTIVO",52,y,8,VIOLET,"Arial-Bold"); txt(c,"FORMATO",250,y,8,VIOLET,"Arial-Bold"); txt(c,"CONTENIDO MÍNIMO",420,y,8,VIOLET,"Arial-Bold"); y-=28
    for a,b,d in rows:
        c.setFillColor(WHITE); c.rect(52,y-32,856,47,fill=1,stroke=0); txt(c,a,52,y,10,PURPLE,"Arial-Bold"); txt(c,b,250,y,9,INK,"Arial"); txt(c,d,420,y,9,GRAY,"Arial",maxw=450); y-=52

def page_governance(c,n):
    title(c,n,"Gestión","Gobernanza y versionado")
    data=[("CUSTODIA","Un equipo responsable conserva maestros, licencias, plantillas y registro de cambios."),("SOLICITUDES","Toda adaptación debe indicar objetivo, canal, territorio, fecha y responsable."),("EXCEPCIONES","Documentar por escrito cualquier excepción de marca y su vigencia."),("VERSIONES","Nombrar archivos con programa_pieza_canal_fecha_v##; evitar ‘final_final’."),("AUDITORÍA","Revisar trimestralmente piezas, accesibilidad, activos y necesidades territoriales."),("ACTUALIZACIÓN","Toda nueva edición debe declarar cambios y retirar archivos obsoletos.")]
    for i,(a,b) in enumerate(data):
        x=52+(i%3)*290; y=330-(i//3)*145; label(c,a,x,y,VIOLET); txt(c,b,x,y-28,10,GRAY,"Arial",maxw=250,leading=13)

def page_sources(c,n):
    title(c,n,"Gestión","Fuentes y decisiones editoriales")
    refs=[("Manual práctico e inspirador para la implementación de la estrategia Estamos con la Vida · MinCulturas · junio de 2024","Marco institucional: voz, identidad visual, color, tipografía, fotografía, composición y co-branding."),("Manual de marca · línea gráfica Plan Nacional de Música · 2025","Fuente específica: key visual 2025-2035, símbolo circular, paleta musical y aplicaciones iniciales."),("Activos PNG suministrados","Identificador horizontal de huellas y versión clara sobre transparencia, conservados como referencias de legado.")]
    y=350
    for i,(a,b) in enumerate(refs,1):
        txt(c,f"0{i}",52,y,11,GREEN,"Arial-Bold"); txt(c,a,100,y,11,PURPLE,"Arial-Bold",maxw=760,leading=14); txt(c,b,100,y-42,9.5,GRAY,"Arial",maxw=760,leading=13); y-=105
    txt(c,"Nota editorial: las reglas nuevas de reducción, accesibilidad, gobernanza y producción se formulan como recomendaciones operativas para completar el sistema. Deben validarse con el equipo custodio de marca antes de declararse norma institucional.",52,82,8.8,GRAY,"Arial",maxw=820,leading=12)

def page_closing(c,n):
    c.setFillColor(GREEN); c.rect(0,0,W,H,fill=1,stroke=0)
    txt(c,"QUE CADA PIEZA",52,390,36,PURPLE,"Arial-Narrow-Bold")
    txt(c,"SUENE A TERRITORIO,",52,350,36,PURPLE,"Arial-Narrow-Bold")
    txt(c,"ENCUENTRO Y FUTURO.",52,310,36,PURPLE,"Arial-Narrow-Bold")
    dot_rule(c,650,130,280,PURPLE)
    txt(c,"PLAN NACIONAL",715,255,21,PURPLE,"Arial-Narrow-Bold",align="center")
    txt(c,"DE MÚSICA PARA",715,232,21,PURPLE,"Arial-Narrow-Bold",align="center")
    txt(c,"LA CONVIVENCIA",715,209,21,PURPLE,"Arial-Narrow-Bold",align="center")
    txt(c,"PLAN NACIONAL DE MÚSICA PARA LA CONVIVENCIA",52,102,10,PURPLE,"Arial-Bold")
    txt(c,"Sistema de marca 2025-2035",52,80,9,PURPLE,"Arial")
    footer(c,n,"cierre",False)

PAGES=[page_cover,page_scope,page_contents,page_essence,page_position,page_principles,page_audiences,page_voice,page_writing,page_architecture,page_signature,page_legacy,page_versions,page_clearspace,page_size,page_backgrounds,page_misuse,page_palette,page_color_roles,page_contrast,page_type,page_hierarchy,page_graphics,page_photo,page_composition,page_icon,page_cobrand,page_social,page_print,page_presentation,page_video,page_templates,page_process,page_check,page_assets,page_governance,page_sources,page_closing]

def main():
    OUT.parent.mkdir(parents=True,exist_ok=True)
    c=canvas.Canvas(str(OUT),pagesize=(W,H),pageCompression=1)
    c.setTitle("Manual de Marca PNMC 2025-2035")
    c.setAuthor("Plan Nacional de Música para la Convivencia")
    for i,fn in enumerate(PAGES,1):
        fn(c,i); c.showPage()
    c.save(); print(OUT)

if __name__=="__main__": main()
