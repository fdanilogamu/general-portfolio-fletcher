from pathlib import Path
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import Paragraph
from reportlab.lib.styles import ParagraphStyle

ROOT = Path(__file__).resolve().parent
for name, file in [('Serif','georgia.ttf'),('Sans','segoeui.ttf'),('Bold','segoeuib.ttf')]:
    pdfmetrics.registerFont(TTFont(name, str(Path('C:/Windows/Fonts')/file)))
W,H=A4
M=56.7
CW=W-2*M
light=dict(bg='#F4F1E9',fg='#202522',accent='#176B5B',secondary='#0F5549',muted='#68706C',border='#D7D7CF',panel='#FAF8F2')
dark=dict(bg='#171B1A',fg='#EFEEE8',accent='#94CFBD',secondary='#B3E1D4',muted='#A9B0AC',border='#35403C',panel='#202623')
c=canvas.Canvas(str(ROOT/'portfolio-pdf-style-guide.pdf'),pagesize=A4)
c.setTitle('Portfolio PDF Styling Guide | Fletcher Galeano')
c.setAuthor('Fletcher Galeano')
theme=light
def rect(x,y,w,h,color):
    c.setFillColor(HexColor(color));c.rect(x,H-y-h,w,h,fill=1,stroke=0)
def text(s,x,y,size=11,font='Sans',color=None):
    c.setFillColor(HexColor(color or theme['fg']));c.setFont(font,size);c.drawString(x,H-y-size,s)
def para(s,y,width=CW,size=11,font='Sans',color=None,x=M,leading=None):
    p=Paragraph(s,ParagraphStyle('p',fontName=font,fontSize=size,leading=leading or size*1.55,textColor=HexColor(color or theme['fg'])))
    _,h=p.wrap(width,H);p.drawOn(c,x,H-y-h);return y+h
def rule(y,x=M,width=CW,color=None):rect(x,y,width,.6,color or theme['border'])
def label(s,y,x=M,color=None):
    t=c.beginText(x,H-y-8);t.setFont('Bold',8);t.setCharSpace(.85);t.setFillColor(HexColor(color or theme['accent']));t.textLine(s.upper());t.setCharSpace(0);c.drawText(t)
def page(n,section,mode=light):
    global theme
    theme=mode;rect(0,0,W,H,theme['bg']);text('Fletcher Galeano / Portfolio',M,26,8,color=theme['muted']);text('PDF DESIGN REFERENCE',W-M-110,26,8,color=theme['muted']);rule(47)
    rule(H-49);text(section,M,H-36,8,color=theme['muted']);text(f'{n:02}',W-M-12,H-36,8,color=theme['muted'])
def title(eyebrow,heading):label(eyebrow,75);text(heading,M,98,32,'Serif')

page(1,'01 / Visual language',dark)
label('A field notebook, on paper',105)
text('Portfolio',M,147,48,'Serif');text('PDF styling guide',M,201,43,'Serif')
para('An editorial system for reports, proposals, essays, and practical tools.',277,370,15,color=dark['muted'],leading=23)
rect(M,359,58,3,dark['accent'])
para('Calm. Curious. Useful.',393,size=24,font='Serif')
para('Large serif headings meet quiet sans-serif text. Warm neutrals leave room for ideas; green accents help the reader find their way.',442,width=420,size=12)
for i,(name,col) in enumerate([('Charcoal',dark['bg']),('Cream',light['bg']),('Mint',dark['accent']),('Forest',light['accent'])]):
    x=M+i*124;rect(x,540,110,66,col)
    c.setStrokeColor(HexColor(dark['border']));c.rect(x,H-606,110,66,stroke=1,fill=0)
    text(name,x,617,9,color=dark['muted']);text(col.upper(),x,635,9)
para('Based on the current main portfolio source, including the 2026 visual refresh. Colors and font families are source-derived; PDF measurements are recommendations.',686,size=9,color=dark['muted'],leading=14)
text('8 October 2026',M,752,9,color=dark['muted']);c.showPage()

page(2,'02 / Color system')
title('Semantic tokens','A palette with purpose')
para('Choose light for long reading and printing; choose dark for a screen-first cover or short digital document. Change every token together.',153,size=11)
cols=[M,M+250]
for x,th,name in [(cols[0],light,'LIGHT / PRINT-FRIENDLY'),(cols[1],dark,'DARK / SCREEN-FIRST')]:
    label(name,212,x)
    for i,(key,display) in enumerate([('bg','Page'),('fg','Text'),('accent','Accent / links'),('secondary','Secondary accent'),('muted','Muted text'),('border','Rules / borders'),('panel','Panels / table fill')]):
        y=239+i*48;rect(x,y,32,32,th[key]);text(display,x+44,y,10,'Bold');text(th[key].upper(),x+44,y+16,9,color=light['muted'])
rule(589)
label('Specialized cues',612)
rect(M,636,32,32,'#E5B522');text('Gold #E5B522',M+44,634,11,'Bold');para('One next-step cue. Use #242015 text.',652,width=390,size=10,x=M+44)
rect(M,690,32,32,'#4DB8D4');text('Cyan #4DB8D4',M+44,688,11,'Bold');para('Knowledge-architect route. Use #181818 text.',706,width=390,size=10,x=M+44)
para('Use green for small accent text. Gold and cyan work as fills with dark labels. Alternate table rows use the panel token.',747,size=9,color=light['muted'],leading=12);c.showPage()

page(3,'03 / Typography and geometry')
title('Type + rhythm','Give ideas room')
label('Georgia / regular',158);text('Editorial headings',M,182,29,'Serif')
para('Pair the portfolio\'s Georgia headings with Inter or its system-font fallback. This guide embeds Georgia and Segoe UI.',229,size=11)
rows=[('Cover title','40-48 pt','Short lines; 1.05-1.12 leading'),('Page / section title','28-34 / 20-24 pt','Regular serif; generous space above'),('Body copy','10.5-11 pt','16-18 pt leading; left aligned'),('Label / caption','8-9 pt','Sans-serif; restrained uppercase')]
label('Recommended PDF scale',292)
for i,(a,b,d) in enumerate(rows):
    y=319+i*49;rule(y);text(a,M,y+11,10,'Bold');text(b,M+154,y+11,10);text(d,M,y+29,9,color=light['muted'])
label('A4 portrait / practical defaults',544)
para('20 mm margins. One primary column. Use two columns for short cards or comparisons, with a 6-8 mm gutter.',570,size=11)
para('Aim for 55-80 characters per line. Use a 4 pt spacing unit: 8-12 pt between paragraphs, 16-24 pt between related blocks, and 28-40 pt between sections.',625,size=11)
rect(M,698,CW, sixty:=61,light['panel']);rect(M,698,2.5,sixty,light['accent'])
para('Preserve the website\'s hierarchy, then adapt its proportions to paper. Let multiline headings breathe.',711,width=CW-32,size=13,font='Serif',x=M+16,leading=18);c.showPage()

page(4,'04 / Components and export')
title('Reusable elements','A page in practice')
para('Use flat panels, thin rules, and a clear reading order. Keep decoration quiet so the content can carry the page.',151,size=11)
rect(M,207,CW,81,light['panel']);rect(M,207,3,81,light['accent'])
para('"Give a connection enough form to meet reality and see what happens."',223,width=CW-36,size=16,font='Serif',x=M+18,leading=22)
text('Portfolio-inspired callout / 12-18 pt padding',M+18,265,8,color=light['muted'])
label('Table specimen',318)
rect(M,342,CW,30,light['panel']);text('Element',M+10,350,10,'Bold',light['accent']);text('Treatment',M+160,350,10,'Bold',light['accent']);rect(M,371,CW,1,light['accent'])
for i,(a,b) in enumerate([('Cards','Square corners; 0.5 pt border; no shadow'),('Links','Green, underlined, and clickable'),('Figures','Clear full frame; muted caption below')]):
    y=373+i*31
    if i%2==1:rect(M,y,CW,31,light['panel'])
    text(a,M+10,y+8,10);text(b,M+160,y+8,9);rule(y+30)
label('A repeatable document recipe',496)
para('<b>Cover:</b> eyebrow, large title, short description, author/date.<br/><b>Content:</b> serif heading, introduction, evidence, one callout.<br/><b>Closing:</b> takeaway, sources, and one clear next step.',522,size=10.5,leading=18)
label('Before exporting',609)
para('Embed fonts; preserve selectable text and active links. Use vector graphics and 300 ppi images at placed size. Keep headings with their following text and repeat table headers across page breaks.',634,size=10.5,leading=16)
para('Inspect every page for clipping and awkward breaks. Check grayscale for print; target 4.5:1 contrast for small text. Use RGB for digital output and a printer-specified profile for press work.',697,size=10.5,leading=16)
text('Full tokens, rules, and reusable prompt are in the companion Markdown guide.',M,763,8,color=light['muted'])
c.save()
print(ROOT/'portfolio-pdf-style-guide.pdf')

