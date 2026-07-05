-- Cardápio COMPLETO do MiniBar Gem (as 3 abas: Carta de Drinks + Menu + Bebidas)
-- semeado no bar "Aurora Bar". Só estrutura (nome, descrição, preço) — sem imagens.
-- Desativa o cardápio atual (sem apagar, preserva vendas) e insere o novo, ativo.
-- Rode no SQL Editor do Supabase.

do $$
declare
  v_bar uuid;
  ca uuid; mo uuid; cl uuid; es uuid; hh uuid; en uuid; bu uuid; pr uuid; ex uuid; so uuid; bn uuid; ce uuid; jd uuid;
begin
  select id into v_bar from public.bars where nome = 'Aurora Bar' order by created_at asc limit 1;
  if v_bar is null then raise exception 'Bar "Aurora Bar" não encontrado.'; end if;

  update public.categorias set ativo = false where bar_id = v_bar;
  update public.produtos   set ativo = false where bar_id = v_bar;
  update public.destaques  set ativo = false where bar_id = v_bar;

  insert into public.categorias (bar_id, nome, ordem, ativo) values (v_bar,'Drinks Autorais',1,true)             returning id into ca;
  insert into public.categorias (bar_id, nome, ordem, ativo) values (v_bar,'Mocktails',2,true)                   returning id into mo;
  insert into public.categorias (bar_id, nome, ordem, ativo) values (v_bar,'Clássicos da Coquetelaria',3,true)   returning id into cl;
  insert into public.categorias (bar_id, nome, ordem, ativo) values (v_bar,'Especial do Dia',4,true)             returning id into es;
  insert into public.categorias (bar_id, nome, ordem, ativo) values (v_bar,'Happy Hour',5,true)                  returning id into hh;
  insert into public.categorias (bar_id, nome, ordem, ativo) values (v_bar,'Entradinhas',6,true)                 returning id into en;
  insert into public.categorias (bar_id, nome, ordem, ativo) values (v_bar,'Burger & Sanduíches',7,true)         returning id into bu;
  insert into public.categorias (bar_id, nome, ordem, ativo) values (v_bar,'Principais',8,true)                  returning id into pr;
  insert into public.categorias (bar_id, nome, ordem, ativo) values (v_bar,'Extras',9,true)                      returning id into ex;
  insert into public.categorias (bar_id, nome, ordem, ativo) values (v_bar,'Sobremesas',10,true)                 returning id into so;
  insert into public.categorias (bar_id, nome, ordem, ativo) values (v_bar,'Bebidas Não Alcoólicas',11,true)     returning id into bn;
  insert into public.categorias (bar_id, nome, ordem, ativo) values (v_bar,'Cervejas',12,true)                   returning id into ce;
  insert into public.categorias (bar_id, nome, ordem, ativo) values (v_bar,'Especiais Jack Daniel''s',13,true)   returning id into jd;

  insert into public.produtos (bar_id, categoria_id, nome, descricao, preco, custo_status, imagem_url, ativo, controla_estoque) values
    -- Drinks Autorais
    (v_bar, ca, 'Sertões e Sertões', '(Ácido e frutado) Cachaça Origem + gengibre + vermute caju + espuma de caju — o moscow mule do sertão', 37, 'sem', null, true, false),
    (v_bar, ca, 'Corsário', '(Cítrico e levemente adocicado) Gin + cordial de acerola + vermute caju + solução cítrica', 46, 'sem', null, true, false),
    (v_bar, ca, 'Mai Tai Nordestino', '(Condimentado e potente) Blend de runs + tamarindo + maracujá + orgeat de licuri + angostura', 42, 'sem', null, true, false),
    (v_bar, ca, 'Chopp Gem', '(Adocicado e lupulado) Bourbon + solução cítrica + maracujá + licor de ervas + cerveja', 39, 'sem', null, true, false),
    (v_bar, ca, 'Sopro Diamantino', '(Potente com toque amargo) Bourbon + blend de vermutes + toque floral', 35, 'sem', null, true, false),
    (v_bar, ca, 'Alvorada', '(Cítrico e frutado) Cachaça Origem + frutas amarelas (manga, maracujá e cajá) + cordial de acerola + solução cítrica', 46, 'sem', null, true, false),
    (v_bar, ca, 'Fruta Nera', '(Frutado, suave e inquieto) Borbú Jabuticaba Cia dos Fermentados + destilado de jabuticaba Lemavos + shrub de caju', 48, 'sem', null, true, false),
    (v_bar, ca, 'Ervas e Flores (sem álcool)', '(Floral e herbal) Hibisco + jasmim + erva doce + água de coco + solução cítrica', 21, 'sem', null, true, false),
    (v_bar, ca, 'Equilíbrio', '(Cítrico, levemente doce e apimentado) Scotch whisky + limão + pimenta doce + açúcar', 38, 'sem', null, true, false),
    (v_bar, ca, 'Mandacaru', 'Cachaça Origem + maracujá selvagem + limão + xarope de caju + xarope de coentro', 39, 'sem', null, true, false),
    -- Mocktails
    (v_bar, mo, 'Fanfarra', '(Frutado e suave) Maracujá + cajá + manga + coentro + açúcar + limão', 24, 'sem', null, true, false),
    (v_bar, mo, 'Soda', 'Maracujá do mato | Acerola | Gengibre', 22, 'sem', null, true, false),
    (v_bar, mo, 'Tabuleiro', '(Adocicado e fresco) Cordial de acerola + gengibre + açúcar + limão + tônica', 24, 'sem', null, true, false),
    -- Clássicos da Coquetelaria
    (v_bar, cl, 'Boulevardier', null, 42, 'sem', null, true, false),
    (v_bar, cl, 'Fitzgerald', null, 38, 'sem', null, true, false),
    (v_bar, cl, 'Mojito', null, 36, 'sem', null, true, false),
    (v_bar, cl, 'Negroni', null, 42, 'sem', null, true, false),
    (v_bar, cl, 'Rabo de Galo', null, 32, 'sem', null, true, false),
    (v_bar, cl, 'Whisky Sour', null, 38, 'sem', null, true, false),
    -- Especial do Dia
    (v_bar, es, 'Mexilhões + Batata frita', 'Mexilhões (8un) + Batata frita (180g)', 58, 'sem', null, true, false),
    -- Happy Hour
    (v_bar, hh, 'Taco de Camarão Crocante', 'Camarão empanado + alface + vinagrete de manga verde + aioli de páprica + meia cura (2un.)', 36, 'sem', null, true, false),
    (v_bar, hh, 'Pastel de cupim', 'Pastel de cupim acompanhado de fonduta de queijo meia cura (02und)', 28, 'sem', null, true, false),
    (v_bar, hh, 'Combo Gem', 'Burger Gem + Batata frita (porção)', 65, 'sem', null, true, false),
    -- Entradinhas
    (v_bar, en, 'Caldinho de Frutos do Mar', 'Caldinho de frutos do mar + espuma de coco', 28, 'sem', null, true, false),
    (v_bar, en, 'Sonho de Vatapá (04 und)', 'Sonho de vatapá + peixe curado + mujjol', 34, 'sem', null, true, false),
    -- Burger & Sanduíches
    (v_bar, bu, 'Burger Gem', 'Pão artesanal + 130g de Black Angus + cebola em três versões (maionese + crispy e picles)', 42, 'sem', null, true, false),
    (v_bar, bu, 'Mini Hot Dog', 'Mini hot dog (50g) + aioli + barbecue picante + picles de cebola (2un.)', 26, 'sem', null, true, false),
    (v_bar, bu, 'Pãozão com Carne Crocante', 'Pão artesanal + carne de panela crocante (100g) + saladinha de maçã verde + abacate + picles de cebola roxa', 38, 'sem', null, true, false),
    (v_bar, bu, 'Mini Sanduba de Camarão', 'Mini sanduba de camarão + fonduta de provolone', 32, 'sem', null, true, false),
    -- Principais
    (v_bar, pr, 'Tartare de Black Angus', 'Tartare de Black Angus (130g) + béarnaise de vinho tinto + castanha + alcaparra + meia cura + focaccia', 62, 'sem', null, true, false),
    (v_bar, pr, 'Polvo Grelhado', 'Polvo grelhado (120g) + mini batatas assadas + béarnaise de vinho tinto + crispy de arroz negro + páprica defumada', 74, 'sem', null, true, false),
    (v_bar, pr, 'Espetinho de coração', 'Coração marinado (12und) + molho tarê + amendoim + gergelim + coentro', 46, 'sem', null, true, false),
    (v_bar, pr, 'Ceviche', 'Peixe + aji com coco + abacate + crispy de milho + batata doce roxa', 52, 'sem', null, true, false),
    -- Extras
    (v_bar, ex, 'Batata Frita', 'Batata frita + aioli (porção 150g)', 24, 'sem', null, true, false),
    (v_bar, ex, 'Focaccia', 'Focaccia (porção)', 22, 'sem', null, true, false),
    -- Sobremesas
    (v_bar, so, 'Extravagância', 'Bolo de chocolate + creme inglês de paçoca + farofa crocante + sorvete de pudim + brigadeiro', 34, 'sem', null, true, false),
    (v_bar, so, 'Um Passeio pelo México', 'Churros + chantilly de ninho + sorvete de doce de leite + farofinha crocante', 32, 'sem', null, true, false),
    -- Bebidas Não Alcoólicas
    (v_bar, bn, 'Água', 'Com/sem gás', 8, 'sem', null, true, false),
    (v_bar, bn, 'Água de Coco', null, 10, 'sem', null, true, false),
    (v_bar, bn, 'Antárctica Tônica', null, 10, 'sem', null, true, false),
    (v_bar, bn, 'Antárctica Tônica Zero', null, 10, 'sem', null, true, false),
    (v_bar, bn, 'Café', null, 8, 'sem', null, true, false),
    (v_bar, bn, 'Guaraná Antárctica', null, 8, 'sem', null, true, false),
    (v_bar, bn, 'Guaraná Antárctica Zero', null, 8, 'sem', null, true, false),
    (v_bar, bn, 'Pepsi', null, 8, 'sem', null, true, false),
    (v_bar, bn, 'Pepsi Zero', null, 8, 'sem', null, true, false),
    (v_bar, bn, 'Red Bull', null, 18, 'sem', null, true, false),
    (v_bar, bn, 'Suco de Uva', null, 12, 'sem', null, true, false),
    -- Cervejas
    (v_bar, ce, 'Becks', null, 16, 'sem', null, true, false),
    (v_bar, ce, 'Corona', null, 18, 'sem', null, true, false),
    (v_bar, ce, 'Corona Cero', null, 18, 'sem', null, true, false),
    (v_bar, ce, 'IPA Carrie Nation', 'Cerveja intensa, com lúpulos americanos, aromas e sabores cítricos e de frutas amarelas + amargor assertivo. Consumir fresca.', 26, 'sem', null, true, false),
    (v_bar, ce, 'IPA Sour de Caju', 'Suculência, aroma e sabor do caju numa cerveja de acidez assertiva, leve e clara, que lembra um espumante.', 26, 'sem', null, true, false),
    (v_bar, ce, 'Stella Pure Gold', null, 16, 'sem', null, true, false),
    -- Especiais Jack Daniel's
    (v_bar, jd, 'Jack Old No. 7', null, 32, 'sem', null, true, false),
    (v_bar, jd, 'Jack Apple', null, 32, 'sem', null, true, false),
    (v_bar, jd, 'Jack Honey', null, 32, 'sem', null, true, false),
    (v_bar, jd, 'Jack Fire', null, 32, 'sem', null, true, false),
    (v_bar, jd, 'Gentleman Jack', null, 42, 'sem', null, true, false),
    (v_bar, jd, 'Woodford Reserve', null, 48, 'sem', null, true, false),
    (v_bar, jd, 'Single Barrel', null, 55, 'sem', null, true, false),
    (v_bar, jd, 'El Jimador Reposado ou Blanco (Tequila 100% Agave)', null, 30, 'sem', null, true, false),
    (v_bar, jd, 'Fords Gin London Dry', null, 34, 'sem', null, true, false),
    (v_bar, jd, 'Gentleman''s Sour', 'Suco de limão tahiti + xarope de açúcar + clara de ovo (opcional) + dash de Angostura bitters + gelo', 42, 'sem', null, true, false),
    (v_bar, jd, 'Maracujack', 'Jack Daniel''s Tennessee Whiskey + maracujá + xarope de açúcar + refrigerante de citrus + gelo', 42, 'sem', null, true, false);

  raise notice 'MiniBar Gem completo semeado no bar %', v_bar;
end $$;
