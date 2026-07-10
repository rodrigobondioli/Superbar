from PIL import Image, ImageDraw, ImageFont

FB="/usr/share/fonts/opentype/urw-base35/NimbusSans-Bold.otf"
FR="/usr/share/fonts/opentype/urw-base35/NimbusSans-Regular.otf"
def bold(s): return ImageFont.truetype(FB,s)
def reg(s): return ImageFont.truetype(FR,s)

S=1080; PAD=96
BG="#111113"; FG="#FFFFFF"; MUT="#8C8C8C"; SUB="#6B6B75"; ACC="#FF3500"; BLK="#000000"

def wrap(draw, words, maxw):
    # words: list of (text, font, color). Returns list of lines; each line list of (text,font,color,width)
    lines=[]; cur=[]; cw=0
    space=draw.textlength(" ", font=words[0][1])
    for t,f,c in words:
        w=draw.textlength(t, font=f)
        add=w if not cur else w+space
        if cw+add>maxw and cur:
            lines.append(cur); cur=[]; cw=0; add=w
        cur.append((t,f,c,w)); cw+=add
    if cur: lines.append(cur)
    return lines

def draw_lines(draw, lines, x, y, lh, space):
    for ln in lines:
        cx=x
        for t,f,c,w in ln:
            draw.text((cx,y), t, font=f, fill=c)
            cx+=w+space
        y+=lh
    return y

def seg(text, f, c):
    return [(w,f,c) for w in text.split(" ")]

def header(draw, idx, dark=True):
    dot_c = ACC if dark else BLK
    dot_fg = BLK if dark else ACC
    txt_c = FG if dark else BLK
    num_c = SUB if dark else "#5c1400"
    # SB dot
    draw.rounded_rectangle([PAD,PAD,PAD+58,PAD+58], radius=16, fill=dot_c)
    fb=bold(24); tb=draw.textbbox((0,0),"SB",font=fb)
    draw.text((PAD+29-(tb[2]-tb[0])/2, PAD+29-(tb[3]-tb[1])/2-tb[1]), "SB", font=fb, fill=dot_fg)
    draw.text((PAD+72,PAD+14),"SUPERBAR",font=bold(30),fill=txt_c)
    cnt=f"{idx:02d}/07"; w=draw.textlength(cnt,font=bold(26))
    draw.text((S-PAD-w,PAD+16),cnt,font=bold(26),fill=num_c)

def slide(idx, kind, headline, body=None, badge=None, foot=None, cta=None, footline=None):
    dark = kind!="cta"
    img=Image.new("RGB",(S,S), BG if dark else ACC)
    d=ImageDraw.Draw(img)
    header(d, idx, dark)
    y=PAD+150
    if badge:
        d.rounded_rectangle([PAD,y,PAD+112,y+112], radius=28, fill="#3a1200" if dark else "#000000")
        fb=bold(64); tb=d.textbbox((0,0),badge,font=fb)
        d.text((PAD+56-(tb[2]-tb[0])/2, y+56-(tb[3]-tb[1])/2-tb[1]), badge, font=fb, fill=ACC)
        y+=112+44
    # headline
    hf = bold(96) if kind=="cover" else (bold(84) if kind=="cta" else bold(72))
    hc = FG if dark else BLK
    lh = int(hf.size*1.06)
    y=draw_lines(d, wrap(d,[(t,hf,(ACC if col=='a' else hc)) for t,col in headline], S-2*PAD), PAD, y, lh, d.textlength(" ",font=hf))
    if body:
        y+=34
        bf=reg(35); bbf=bold(35)
        bw=[]
        for t,b in body: bw.append((t, bbf if b else bf, (FG if dark else "#1a1a1a") if b else (MUT if dark else "#2a1000")))
        y=draw_lines(d, wrap(d,bw,S-2*PAD), PAD, y, int(35*1.5), d.textlength(" ",font=bf))
    if cta:
        cy=S-PAD-190
        tw=d.textlength(cta,font=bold(34))
        d.rounded_rectangle([PAD,cy,PAD+tw+64,cy+72], radius=36, fill=BLK)
        d.text((PAD+32,cy+18),cta,font=bold(34),fill=FG)
    if foot:
        fc=ACC if dark else BLK
        d.text((PAD,S-PAD-40),foot,font=bold(30),fill=fc)
    if footline:
        d.text((PAD,S-PAD-40),footline,font=bold(30),fill="#1a1a1a")
    img.save(f"slide-{idx:02d}.png","PNG")
    print("saved",idx)

# headline as list of (word, 'n'|'a')  a=accent
def H(s, accent_words=()):
    out=[]
    for w in s.split(" "):
        out.append((w,'a' if w.strip('?.,') in accent_words else 'n'))
    return out
def B(pairs): return pairs  # list of (word,bold)
def bd(s, bolds=()):
    return [(w, w.strip('?.,—') in bolds) for w in s.split(" ")]

slide(1,"cover", H("Seu bar enche toda sexta. Então cadê o lucro no fim do mês?", {"lucro"}), foot="5 vazamentos invisíveis  →")
slide(2,"leak", H("O CMV que ninguém calcula"), body=bd("Se você não sabe o custo de cada drink, você não tem preço — tem chute. A caipirinha pode estar dando prejuízo enquanto você comemora o giro.", {"chute."}), badge="1", foot="→")
slide(3,"leak", H("A dose na mão"), body=bd("2ml a mais por drink parece nada. Multiplica por 300 numa sexta: é uma garrafa inteira de gin evaporando por noite — e some do estoque, não do caixa.", {"garrafa","inteira","gin"}), badge="2", foot="→")
slide(4,"leak", H("O erro que virou cortesia"), body=bd("Saiu errado, refez, o primeiro foi de boa. Cada refação é insumo pago que ninguém registrou. Some do lucro e não aparece em lugar nenhum.", {"insumo","pago"}), badge="3", foot="→")
slide(5,"leak", H("O campeão que lucra pouco"), body=bd("Seu drink mais vendido pode ser seu pior negócio. Volume não é margem. Sem olhar os dois juntos, você empurra o que te dá menos dinheiro.", {"pior","negócio."}), badge="4", foot="→")
slide(6,"leak", H("O fechamento no escuro"), body=bd("Você só sabe quanto fez no dia seguinte, na planilha. Quando o número chega, a noite de decidir o que fazer já passou.", {"no","dia","seguinte,"}), badge="5", foot="e agora?  →")
slide(7,"cta", H("O Superbar enxerga os 5 — em tempo real."), body=bd("Onde vaza, qual drink lucra, quanto sobra. Sem planilha, sem adivinhação.", set()), cta="superbar.com.br  →", footline="Seu bar ficou super inteligente.")
print("done")
