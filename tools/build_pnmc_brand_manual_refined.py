from pathlib import Path
from PIL import Image, ImageChops, ImageDraw, ImageFont
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor, Color
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase.pdfmetrics import stringWidth

ROOT=Path('.')
OUT=ROOT/'docs/marca/pdf/Manual_de_Marca_PNMC_Propuesta_Light_Dark.pdf'
TMP=ROOT/'tmp/pdfs/refined'; TMP.mkdir(parents=True,exist_ok=True)
LOGO_SRC=ROOT/'tmp/pdfs/min-fonts/logo-1.png'
GREGOR=ROOT/'tmp/pdfs/min-fonts/gregor.bin'; ALT=ROOT/'tmp/pdfs/min-fonts/alternate.bin'
NUN=ROOT/'tmp/pdfs/min-fonts/NunitoSans-Regular.ttf'; NUNB=ROOT/'tmp/pdfs/min-fonts/NunitoSans-Bold.ttf'
W,H=1920,1080
V=HexColor('#291242'); G=HexColor('#00DA5E'); M=HexColor('#8BF784'); P=HexColor('#533075'); L=HexColor('#E6DAE5'); PAPER=HexColor('#F7F3F7'); NIGHT=HexColor('#0D0820'); INK=HexColor('#1D0B30'); WHITE=HexColor('#FFFFFF'); ORANGE=HexColor('#3D1A63'); CYAN=HexColor('#D8F8D6')

def rgba(c,a): return Color(c.red,c.green,c.blue,alpha=a)
def prep_logo():
    im=Image.open(LOGO_SRC).convert('RGBA'); bg=Image.new('RGBA',im.size,(255,255,255,255)); d=ImageChops.difference(im,bg).convert('L').point(lambda v:255 if v>18 else 0)
    bbox=d.getbbox(); crop=im.crop(bbox); alpha=d.crop(bbox)
    black=Image.new('RGBA',crop.size,(0,0,0,255)); black.putalpha(alpha); white=Image.new('RGBA',crop.size,(255,255,255,255)); white.putalpha(alpha)
    cyan=Image.new('RGBA',crop.size,(30,215,230,255)); cyan.putalpha(alpha)
    for n,x in [('official-black.png',black),('official-white.png',white),('official-cyan.png',cyan)]: x.save(TMP/n)
    # The icon is cropped directly from the official logo artwork; it is not redrawn.
    split=int(crop.width*.31); symbol_alpha=alpha.crop((0,0,split,crop.height)); sb=Image.new('RGBA',(split,crop.height),(0,0,0,255)); sb.putalpha(symbol_alpha)
    sw=Image.new('RGBA',(split,crop.height),(255,255,255,255)); sw.putalpha(symbol_alpha)
    sb.save(TMP/'official-symbol-black.png'); sw.save(TMP/'official-symbol-white.png')
prep_logo(); pdfmetrics.registerFont(TTFont('Nunito',str(NUN)));pdfmetrics.registerFont(TTFont('NunitoBold',str(NUNB)))

class Book:
 def __init__(self):
  OUT.parent.mkdir(parents=True,exist_ok=True); self.c=canvas.Canvas(str(OUT),pagesize=(W,H),pageCompression=1); self.p=0
  self.c.setTitle('Manual de Marca PNMC - Propuesta Light y Dark');self.c.setAuthor('Plan Nacional de Música para la Convivencia');self.c.setSubject('Sistema visual con marca oficial y tipografías MinCultura')
 def r(self,x,y,w,h,fill,rad=0,stroke=None,sw=1):
  self.c.setFillColor(fill);self.c.setStrokeColor(stroke or fill);self.c.setLineWidth(sw)
  if rad:self.c.roundRect(x,y,w,h,rad,fill=1,stroke=1 if stroke else 0)
  else:self.c.rect(x,y,w,h,fill=1,stroke=1 if stroke else 0)
 def l(self,x1,y1,x2,y2,col,sw=2):self.c.setStrokeColor(col);self.c.setLineWidth(sw);self.c.line(x1,y1,x2,y2)
 def text(self,s,x,y,size=24,col=INK,font='Nunito',align='left'):
  self.c.setFont(font,size);self.c.setFillColor(col)
  if align=='right':self.c.drawRightString(x,y,s)
  elif align=='center':self.c.drawCentredString(x,y,s)
  else:self.c.drawString(x,y,s)
 def para(self,s,x,y,width,size=22,col=INK,font='Nunito',lead=None):
  lead=lead or size*1.35; words=s.split(); lines=[]; line=''
  for word in words:
   q=(line+' '+word).strip()
   if stringWidth(q,font,size)<=width:line=q
   else:lines.append(line);line=word
  if line:lines.append(line)
  for i,t in enumerate(lines):self.text(t,x,y-i*lead,size,col,font)
  return y-len(lines)*lead
 def img(self,path,x,y,w,h):self.c.drawImage(str(path),x,y,w,h,mask='auto',preserveAspectRatio=True,anchor='c')
 def type_image(self,s,x,y,w,h,font_path,size,col,align='left'):
  # High-resolution transparent title layer preserves the licensed OTF outlines through FreeType rendering.
  scale=3; im=Image.new('RGBA',(int(w*scale),int(h*scale)),(0,0,0,0));d=ImageDraw.Draw(im); f=ImageFont.truetype(str(font_path),size*scale)
  box=d.multiline_textbbox((0,0),s,font=f,spacing=int(size*.06*scale)); tw=box[2]; tx=0 if align=='left' else (im.width-tw)//2 if align=='center' else im.width-tw
  rgb=(int(col.red*255),int(col.green*255),int(col.blue*255),255);d.multiline_text((tx,0),s,font=f,fill=rgb,spacing=int(size*.06*scale))
  p=TMP/f't-{len(list(TMP.glob("t-*.png"))):03d}.png';im.save(p);self.img(p,x,y,w,h)
 def logo(self,x,y,w,dark=False,cyan=False):self.img(TMP/('official-white.png' if dark else 'official-black.png'),x,y,w,w*.36)
 def label(self,s,x,y,col=G):self.type_image(s.upper(),x,y,360,40,ALT,22,col)
 def page(self,title,section,dark=False):
  self.p+=1;bg=NIGHT if dark else PAPER;fg=PAPER if dark else INK;self.r(0,0,W,H,bg)
  self.logo(95,930,238,dark);self.label(section,100,855,G);self.type_image(title.upper(),100,760,1600,85,GREGOR,68,fg)
  self.l(100,730,1820,730,rgba(fg,.22),1);self.text(f'{self.p:02d}',1815,45,17,fg,'NunitoBold','right');self.text('PNMC · SISTEMA VISUAL PROPUESTO',100,45,14,fg,'NunitoBold')
  return fg
 def finish(self):self.c.save()

def wave(b,x,y,w,h,col,alpha=.35):
 c=b.c;c.saveState();c.setStrokeColor(rgba(col,alpha));c.setLineWidth(3);c.setLineCap(1)
 for i in range(9):
  yy=y+i*h/10; path=c.beginPath();path.moveTo(x,yy)
  path.curveTo(x+w*.20,yy+h*.20,x+w*.42,yy-h*.20,x+w*.60,yy)
  path.curveTo(x+w*.77,yy+h*.18,x+w*.90,yy-h*.18,x+w,yy);c.drawPath(path,stroke=1,fill=0)
 c.restoreState()
def chip(b,x,y,txt,fill,fg):b.r(x,y,210,54,fill,27);b.text(txt,x+105,y+18,16,fg,'NunitoBold','center')
def bullets(b,items,x,y,width,fg):
 for t in items:
  b.r(x,y+5,10,10,G,5); y=b.para(t,x+30,y,width-30,20,fg);y-=18
 return y

def build():
 b=Book();c=b.c
 # cover: deliberately quiet, light and editorial.
 b.r(0,0,W,H,PAPER);wave(b,0,170,1920,420,L,.65);b.l(100,875,1820,875,V,2);b.logo(100,905,300)
 b.label('Manual de identidad visual · 2026',100,800,G);b.type_image('PLAN NACIONAL\nDE MÚSICA PARA\nLA CONVIVENCIA',100,455,1060,280,GREGOR,94,V)
 b.label('Huellas y apuestas de la diversidad sonora',100,360,P);b.para('Sistema visual · propuestas light y dark · marca oficial sin intervención',100,310,780,22,V,'NunitoBold')
 b.r(1400,405,300,300,L,150);b.img(TMP/'official-symbol-black.png',1460,465,180,180);b.text('PNMC',1550,250,18,V,'NunitoBold','center');b.text('Marca oficial · desarrollo visual',1550,215,15,V,'Nunito','center')
 b.text('Plan Nacional de Música para la Convivencia',100,90,16,V,'NunitoBold');b.text('Documento de trabajo · 2026',1820,90,16,V,'Nunito','right')
 b.p=1;c.showPage()
 # 2 narrative
 fg=b.page('Una identidad que se siente viva','01 · PRINCIPIO',True); b.type_image('DIVERSA.\nTERRITORIAL.\nCONTEMPORÁNEA.',120,420,720,255,GREGOR,82,M)
 b.para('La música no se representa con una estética única: se activa con tramas, contrastes, movimiento y voces situadas. El sistema articula la marca oficial con una presencia visual más expresiva.',980,612,620,27,fg,'Nunito',38)
 for i,(n,t) in enumerate([('01','La huella oficial es inviolable.'),('02','El color crea ritmo, no decoración.'),('03','La tipografía construye carácter.'),('04','La imagen reconoce y no exotiza.')]):
  x=980+(i%2)*355;y=420-(i//2)*145;b.text(n,x,y,18,G,'NunitoBold');b.para(t,x,y-36,290,19,fg,'NunitoBold')
 c.showPage()
 #3 typography hierarchy, following the MinCultura composition shown in the references.
 fg=b.page('Jerarquía tipográfica','02 · TIPOGRAFÍA',False)
 b.label('Sistema de lectura',105,670,P);b.type_image('ENCABEZADO 1',105,590,480,68,GREGOR,53,V);b.l(105,568,580,568,P,2)
 b.type_image('ENCABEZADO 2',105,510,480,56,ALT,42,V);b.l(105,490,580,490,P,2)
 b.type_image('SUBTÍTULO / DATO',105,438,480,42,ALT,31,P);b.l(105,420,580,420,P,2)
 b.text('Cuerpo de texto · Nunito Sans Regular · 18/28',105,380,22,V,'Nunito');b.l(105,360,580,360,P,2)
 b.type_image('DESTACADO',105,316,300,32,ALT,21,V);b.text('Etiqueta · Alternate Gothic Extra',105,275,18,V,'Nunito')
 b.r(720,290,960,390,L,28);b.label('MÚSICA PARA LA VIDA',770,620,V);b.type_image('CUIDAR LA\nDIVERSIDAD\nSONORA',770,470,600,150,GREGOR,58,V)
 b.type_image('FORMACIÓN · TERRITORIO · CONVIVENCIA',770,425,690,34,ALT,23,P);b.para('La música activa vínculos, aprendizajes y memorias compartidas. El sistema usa la jerarquía para conducir de una idea principal a la lectura tranquila.',770,380,570,19,V,'Nunito')
 b.label('Reglas',720,310,P);b.para('Gregor: títulos breves, tracking +25. Alternate: subtítulos y datos, tracking +10 a +25. Nunito: cuerpo, tracking -5 a -10.',900,310,700,18,V,'NunitoBold');c.showPage()
 #4 typography application and limits
 fg=b.page('Tipografía: uso correcto e incorrecto','03 · TIPOGRAFÍA',False)
 b.r(100,315,720,360,L,26);b.label('Evitar',145,620,P);b.type_image('UNA FRASE MUY LARGA\nNO DEBE CONVERTIRSE\nEN PÁRRAFO',145,490,570,120,GREGOR,35,V);b.para('No usar Gregor ni Alternate para cuerpos extensos. No comprimir el interlineado ni mezclar estilos sin jerarquía.',145,385,570,19,V,'Nunito')
 b.r(1010,315,720,360,PAPER,26,stroke=G,sw=2);b.label('Aplicar',1055,620,G);b.type_image('MÚSICA QUE\nNOS CONVOCA',1055,510,420,105,GREGOR,48,V);b.type_image('TERRITORIO · MEMORIA · ACCIÓN',1055,465,520,32,ALT,21,P);b.para('Las prácticas musicales conectan personas, saberes y territorios. La lectura permanece clara y cercana.',1055,415,500,19,V,'Nunito')
 b.label('Proporción',100,230,P);b.para('Una pieza debe tener un único encabezado dominante, uno o dos niveles de apoyo y un cuerpo legible. La escala y el espacio son parte de la identidad.',360,230,1250,21,INK,'NunitoBold');c.showPage()
 #4 logo
 fg=b.page('La marca PNMC permanece intacta','03 · LOGOTIPO',True)
 b.r(100,345,940,315,PAPER,28);b.c.drawImage(str(TMP/'official-black.png'),175,410,700,216,mask='auto');b.text('Versión oficial negra · soporte claro',150,385,18,V,'NunitoBold')
 b.r(1110,345,700,315,V,28);b.c.drawImage(str(TMP/'official-white.png'),1175,420,560,202,mask='auto');b.text('Versión oficial blanca · soporte oscuro',1160,385,18,M,'NunitoBold')
 b.label('Desarrollos permitidos',100,255,G);bullets(b,['Usar las variaciones cromáticas oficiales del archivo maestro.','Construir composiciones alrededor de la marca; nunca intervenirla.','Mantener zona libre mínima equivalente a la altura de “MÚSICA”.'],100,215,800,fg)
 b.label('No permitido',1050,255,G);bullets(b,['Redibujar la huella, cambiar proporciones o tipografía del logo.','Aplicar texturas dentro de la marca o usarla sobre fondos sin contraste.'],1050,215,650,fg);c.showPage()
 #5 palette
 fg=b.page('Color con intención, no como relleno','04 · PALETA',False)
 colors=[('Violeta raíz','#291242',V,WHITE),('Violeta medio','#3D1A63',ORANGE,WHITE),('Violeta amable','#533075',P,WHITE),('Violeta bruma','#9B8CB0',HexColor('#9B8CB0'),INK),('Verde pulso','#00DA5E',G,INK),('Verde territorio','#00A849',HexColor('#00A849'),INK),('Menta aire','#8BF784',M,INK),('Lila soporte','#E6DAE5',L,INK)]
 for i,(n,h,co,tx) in enumerate(colors):
  x=100+(i%4)*420;y=490-(i//4)*180;b.r(x,y,365,138,co,20);b.text(n,x+24,y+85,21,tx,'NunitoBold');b.text(h,x+24,y+52,17,tx,'NunitoBold');b.text('Color de sistema',x+24,y+24,14,tx,'Nunito')
 b.label('Light / dark',100,260,P);b.para('LIGHT: Papel + Lila + Violeta raíz; Verde solo para acción. DARK: Noche profunda + Violeta raíz; Lila para información secundaria y Verde como pulso. La paleta extendida da matices sin introducir colores ajenos.',350,260,1220,22,INK,'NunitoBold');c.showPage()
 #6 light
 fg=b.page('Light · claridad editorial y textura viva','05 · PROPUESTA 01',False)
 b.r(100,300,720,365,PAPER,24,stroke=V,sw=2);wave(b,120,325,680,280,P,.5);b.logo(180,500,500);b.type_image('MÚSICA\nPARA HABITAR\nEL TERRITORIO',930,465,720,190,GREGOR,61,V);b.para('Papel, lila y violeta sostienen contenidos extensos. Las ondas lineales sugieren escucha, encuentro y circulación.',935,350,630,23,INK)
 chip(b,930,200,'FONDO: PAPEL',L,V);chip(b,1160,200,'SEÑAL: VERDE',G,NIGHT);chip(b,1390,200,'TEXTO: VIOLETA',P,WHITE);c.showPage()
 #7 dark
 fg=b.page('Dark · energía escénica y profundidad','06 · PROPUESTA 02',True)
 b.r(100,300,740,365,V,24);wave(b,120,330,700,280,G,.65);b.logo(172,485,540,dark=True);b.type_image('SONIDOS\nQUE NOS\nCONVOCAN',965,465,620,190,GREGOR,65,M);b.para('Noche profunda y violeta construyen una escena intensa. El verde activa acciones; el lila organiza la información secundaria.',970,350,620,23,fg)
 chip(b,965,200,'FONDO: NOCHE',V,PAPER);chip(b,1195,200,'PULSO: VERDE',G,NIGHT);chip(b,1425,200,'APOYO: LILA',L,V);c.showPage()
 #8 language
 fg=b.page('Lenguaje gráfico: huellas, ondas y tramas','07 · RECURSOS',False)
 b.r(100,300,480,370,V,24);wave(b,125,360,430,235,G,.9);b.text('ONDA',135,330,16,WHITE,'NunitoBold')
 b.r(630,300,480,370,G,24);[b.l(700+i*42,350,860+i*42,610,V,7) for i in range(6)];b.text('RITMO',665,330,16,INK,'NunitoBold')
 b.r(1160,300,560,370,L,24);b.c.setFillColor(P);[b.c.circle(1300+i*50,480,18,fill=1,stroke=0) for i in range(7)];b.text('TRAMA',1195,330,16,V,'NunitoBold')
 b.label('Regla',100,230,P);b.para('Usar una sola familia gráfica dominante por pieza. El recurso debe ordenar el contenido, enmarcar una fotografía o construir ritmo; nunca competir con el logotipo.',300,230,1300,21,INK,'NunitoBold');c.showPage()
 #9 composition
 fg=b.page('Composición: aire, tensión y contraste','08 · RETÍCULA',True)
 for x in range(150,1760,135):b.l(x,240,x,650,rgba(PAPER,.14),1)
 for y in range(240,670,102):b.l(150,y,1760,y,rgba(PAPER,.14),1)
 b.r(285,444,540,206,V,18);b.r(960,342,405,308,G,18);b.r(1500,240,260,205,L,18);b.type_image('UNA\nIDEA\nDOMINANTE',315,500,410,110,GREGOR,42,PAPER)
 b.label('Sistema',150,180,G);b.para('12 columnas · margen 120 · gutter 24 · espacio base 8. Diseñar con bloques asimétricos y una lectura que avance de información a acción.',410,180,1120,21,fg,'NunitoBold');c.showPage()
 #10 photography
 fg=b.page('Fotografía y dirección de arte','09 · IMAGEN',False)
 cards=[(V,'PERSONAS','Práctica real, mirada a cámara o gesto compartido. Evitar la imagen genérica.'),(G,'TERRITORIO','Paisaje, materia e instrumentos con contexto y crédito.'),(P,'MOMENTO','Escena, movimiento y energía. Una capa de color, nunca filtros acumulados.')]
 for i,(co,t,d) in enumerate(cards):
  x=100+i*560;b.r(x,315,480,340,co,22);b.type_image(t,x+38,550,380,64,ALT,48,WHITE if i!=1 else NIGHT);b.para(d,x+38,470,350,23,WHITE if i!=1 else NIGHT,'NunitoBold');wave(b,x+35,355,385,95,WHITE if i!=1 else V,.32)
 b.label('Ética visual',100,230,P);b.para('Consentimiento, crédito y contexto territorial son parte de la calidad visual. La diversidad no es un recurso estético: es la fuente del relato.',350,230,1280,22,INK,'NunitoBold');c.showPage()
 #11 UI icons
 fg=b.page('Iconos: una gramática sencilla y humana','10 · INTERFAZ',False)
 for i,(t,s) in enumerate([('Explorar','+'),('Escuchar','♪'),('Conectar','↗'),('Consultar','≡')]):
  x=120+i*420;b.r(x,390,330,235,WHITE,24,stroke=rgba(V,.22),sw=1);b.c.setStrokeColor(V);b.c.setLineWidth(7);b.c.circle(x+90,515,45,stroke=1,fill=0)
  if i==0: b.l(x+70,515,x+110,515,V,7);b.l(x+90,495,x+90,535,V,7)
  elif i==1: b.c.circle(x+76,503,14,stroke=1,fill=0);b.l(x+90,503,x+110,486,V,7);b.l(x+110,486,x+110,530,V,7);b.c.circle(x+110,535,7,stroke=1,fill=0)
  elif i==2: b.c.circle(x+68,515,8,stroke=1,fill=0);b.c.circle(x+112,500,8,stroke=1,fill=0);b.c.circle(x+112,532,8,stroke=1,fill=0);b.l(x+75,512,x+105,503,V,6);b.l(x+75,518,x+105,529,V,6)
  else: b.r(x+60,488,62,48,WHITE,6,stroke=V,sw=6);b.l(x+72,520,x+110,520,V,5);b.l(x+72,506,x+102,506,V,5)
  b.type_image(t,x+35,430,220,40,ALT,28,V)
 b.label('Especificación',120,280,P);b.para('Trazo monolineal 1.75 px en grid 24. Radio redondeado. Color base: violeta; estado activo: verde. Los iconos orientan acciones; no sustituyen palabras esenciales.',410,280,1200,21,INK,'NunitoBold');c.showPage()
 #12 web
 fg=b.page('Producto digital: interfaz que respira','11 · WEB',True)
 b.r(130,255,790,440,V,30);b.logo(190,610,300,dark=True);b.type_image('ECOSISTEMA\nMUSICAL',190,485,540,105,GREGOR,55,PAPER);b.para('Información territorial, datos y voces en un mismo sistema.',190,410,520,24,PAPER);chip(b,190,315,'EXPLORAR',G,NIGHT)
 b.r(1050,500,590,102,PAPER,18);b.text('Jerarquía: titular · contexto · acción',1090,545,21,V,'NunitoBold');b.r(1050,350,590,94,rgba(PAPER,.12),18);b.text('Focus: anillo verde + 3 px de separación',1090,388,20,PAPER,'Nunito')
 b.label('Accesibilidad',1050,665,G);b.para('Contraste mínimo de 4.5:1 en texto. Nunca usar solo color para comunicar un estado.',1050,625,610,20,fg,'NunitoBold');c.showPage()
 #13 socials
 fg=b.page('Redes: formatos con una idea por pieza','12 · SOCIAL',False)
 for i,(co,dim,ttl) in enumerate([(V,'1080 × 1080','UNA CIFRA\nQUE SE ESCUCHA'),(G,'1080 × 1350','UNA VOZ\nQUE CONVOCA'),(P,'1080 × 1920','UN GESTO\nQUE PERMANECE')]):
  x=110+i*570;b.r(x,275,470,430,co,26);b.text(dim,x+35,662,16,PAPER if i!=1 else INK,'NunitoBold');b.type_image(ttl,x+35,515,370,115,GREGOR,43,PAPER if i!=1 else NIGHT);wave(b,x+35,350,370,95,M if i==0 else V,.55);b.logo(x+35,300,220,dark=i!=1)
 b.label('Copy',110,200,P);b.para('Directo, situado y respetuoso. Una pieza: una idea, un contexto, una llamada a la acción.',270,200,1250,22,INK,'NunitoBold');c.showPage()
 #14 applications
 fg=b.page('Aplicaciones: sistema, no plantilla rígida','13 · PIEZAS',False)
 for i,(t,co) in enumerate([('PRESENTACIÓN',V),('DOCUMENTO',G),('EVENTO',P)]):
  x=110+i*570;b.r(x,330,470,350,WHITE,20,stroke=rgba(V,.18),sw=1);b.r(x+30,625,410,18,co,9);b.logo(x+50,535,230,dark=False);b.type_image(t,x+50,410,300,52,ALT,36,V);b.para(['16:9 · gran titular · ritmo visual','A4 · jerarquía clara · lectura cómoda','Formato vertical · fecha · lugar · acción'][i],x+50,370,330,18,INK,'Nunito')
 b.label('Co-branding',110,240,P);b.para('La marca PNMC y las marcas institucionales se ubican en una franja independiente del contenido. Usar archivos maestros, respetar precedencia y no competir por escala.',360,240,1250,21,INK,'NunitoBold');c.showPage()
 # icon uses
 fg=b.page('El icono de huellas: presencia sin texto','14 · ICONO',False)
 b.r(100,310,420,370,L,28);b.c.drawImage(str(TMP/'official-symbol-black.png'),190,390,240,240,mask='auto');b.label('Sello editorial',145,345,P)
 b.r(590,310,420,370,V,28);b.r(700,415,200,200,G,100);b.c.drawImage(str(TMP/'official-symbol-black.png'),735,450,130,130,mask='auto');b.label('Avatar / Favicon',635,345,M)
 b.r(1080,310,420,370,NIGHT,28);b.r(1190,415,200,200,P,100);b.c.drawImage(str(TMP/'official-symbol-white.png'),1225,450,130,130,mask='auto');b.label('Marcador dark',1125,345,L)
 b.label('Uso autónomo',100,235,P);b.para('El icono funciona solo cuando la marca completa ya está presente en el contexto o cuando el formato no permite el logotipo: avatar, favicon, sello, marcador de sección, señalización breve y marca de agua. No añadir texto dentro ni alterar sus huellas.',360,235,1260,21,INK,'NunitoBold');c.showPage()
 #15 control
 fg=b.page('Control de calidad antes de publicar','15 · USO RESPONSABLE',True)
 b.r(100,320,720,350,V,24,stroke=G,sw=2);b.type_image('SÍ',145,580,150,55,GREGOR,42,M);bullets(b,['Marca oficial en versión aprobada.','Sistema tipográfico del Ministerio.','Una textura o recurso dominante.','Contraste y zona libre verificados.'],150,525,520,fg)
 b.r(1010,320,720,350,ORANGE,24,stroke=L,sw=2);b.type_image('NO',1055,580,150,55,GREGOR,42,L);bullets(b,['Modificar el logotipo o redibujar la huella.','Usar tipografías fuera del sistema.','Saturar con colores, filtros o iconos.','Sacrificar legibilidad por impacto.'],1060,525,520,fg)
 c.showPage()
 #16 closure
 fg=b.page('Especificaciones y activación','16 · IMPLEMENTACIÓN',False)
 data=[('Logo','Archivo maestro PNMC · PDF / SVG'),('Tipografía','Gregor Upright · Alternate Gothic Extra · Nunito Sans'),('Color','RGB/HEX en digital · conversión CMYK con imprenta'),('Formato','SVG logo · PNG redes · PDF impresión'),('Aprobación','Equipo PNMC + Comunicaciones MinCultura')]
 for i,(a,d) in enumerate(data):
  y=630-i*72;b.r(110,y-12,20,20,[V,G,P,L,M][i],10);b.type_image(a,170,y-6,310,35,ALT,25,V);b.text(d,520,y,21,INK,'NunitoBold')
 b.r(110,180,1600,105,V,20);b.type_image('HUELLAS Y APUESTAS DE LA DIVERSIDAD SONORA',150,215,1050,45,GREGOR,31,PAPER);b.logo(1370,205,260,dark=True);b.text('Manual refinado · propuesta de implementación · 2026',150,75,16,V,'NunitoBold');b.finish()
if __name__=='__main__':build()
