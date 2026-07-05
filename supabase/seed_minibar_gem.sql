-- Semeia o cardápio do MiniBar Gem no bar "Aurora Bar" (só a ESTRUTURA — nome,
-- descrição, preço). Sem imagens (você sobe as fotos na mão no admin depois).
-- Desativa o cardápio atual (some do admin e do cliente, sem apagar — preserva
-- histórico de vendas) e insere o novo, ativo. Rode no SQL Editor do Supabase.

do $$
declare
  v_bar uuid;
  c1 uuid; c2 uuid; c3 uuid; c4 uuid; c5 uuid; c6 uuid; c7 uuid;
begin
  select id into v_bar from public.bars where nome = 'Aurora Bar' order by created_at asc limit 1;
  if v_bar is null then raise exception 'Bar "Aurora Bar" não encontrado.'; end if;

  -- Some o cardápio atual (sem deletar — evita erro de FK com comandas)
  update public.categorias set ativo = false where bar_id = v_bar;
  update public.produtos   set ativo = false where bar_id = v_bar;
  update public.destaques  set ativo = false where bar_id = v_bar;

  -- Categorias novas
  insert into public.categorias (bar_id, nome, ordem, ativo) values (v_bar,'Especial do Dia',1,true)      returning id into c1;
  insert into public.categorias (bar_id, nome, ordem, ativo) values (v_bar,'Happy Hour',2,true)           returning id into c2;
  insert into public.categorias (bar_id, nome, ordem, ativo) values (v_bar,'Entradinhas',3,true)          returning id into c3;
  insert into public.categorias (bar_id, nome, ordem, ativo) values (v_bar,'Burger & Sanduíches',4,true)  returning id into c4;
  insert into public.categorias (bar_id, nome, ordem, ativo) values (v_bar,'Principais',5,true)           returning id into c5;
  insert into public.categorias (bar_id, nome, ordem, ativo) values (v_bar,'Extras',6,true)               returning id into c6;
  insert into public.categorias (bar_id, nome, ordem, ativo) values (v_bar,'Sobremesas',7,true)           returning id into c7;

  -- Produtos (imagem_url null — foto entra na mão no admin)
  insert into public.produtos (bar_id, categoria_id, nome, descricao, preco, custo_status, imagem_url, ativo, controla_estoque) values
    (v_bar, c1, 'Mexilhões + Batata frita', 'Mexilhões (8un) + Batata frita (180g)', 58, 'sem', null, true, false),

    (v_bar, c2, 'Corsário', '(Cítrico, levemente adocicado) Gin + cordial de acerola + cúrcuma + limão + leve toque defumado', 39, 'sem', null, true, false),
    (v_bar, c2, 'Taco de Camarão Crocante', 'Camarão empanado + alface + vinagrete de manga verde + aioli de páprica + meia cura (2un.)', 36, 'sem', null, true, false),
    (v_bar, c2, 'Pastel de cupim', 'Pastel de cupim acompanhado de fonduta de queijo meia cura (02und)', 28, 'sem', null, true, false),
    (v_bar, c2, 'Combo Gem', 'Burger Gem + Batata frita (porção)', 65, 'sem', null, true, false),

    (v_bar, c3, 'Taco de Camarão Crocante', 'Camarão empanado (50g) + alface + vinagrete de manga verde + aioli de páprica + meia cura (2un.)', 32, 'sem', null, true, false),
    (v_bar, c3, 'Caldinho de Frutos do Mar', 'Caldinho de frutos do mar + espuma de coco', 28, 'sem', null, true, false),
    (v_bar, c3, 'Pastel de cupim', 'Pastel de cupim acompanhado de fonduta de queijo meia cura (02und)', 28, 'sem', null, true, false),
    (v_bar, c3, 'Sonho de Vatapá (04 und)', 'Sonho de vatapá + peixe curado + mujjol', 34, 'sem', null, true, false),

    (v_bar, c4, 'Burger Gem', 'Pão artesanal + 130g de Black Angus + cebola em três versões (maionese + crispy e picles).', 42, 'sem', null, true, false),
    (v_bar, c4, 'Mini Hot Dog', 'Mini hot dog (50g) + aioli + barbecue picante + picles de cebola (2un.)', 26, 'sem', null, true, false),
    (v_bar, c4, 'Pãozão com Carne Crocante', 'Pão artesanal + carne de panela crocante (100g) + saladinha de maçã verde + abacate + picles de cebola roxa', 38, 'sem', null, true, false),
    (v_bar, c4, 'Mini Sanduba de Camarão', 'Mini sanduba de camarão + fonduta de provolone', 32, 'sem', null, true, false),
    (v_bar, c4, 'Combo Gem', 'Burger Gem + Batata frita (porção)', 65, 'sem', null, true, false),

    (v_bar, c5, 'Tartare de Black Angus', 'Tartare de Black Angus (130g) + béarnaise de vinho tinto + castanha + alcaparra + meia cura + focaccia', 62, 'sem', null, true, false),
    (v_bar, c5, 'Polvo Grelhado', 'Polvo grelhado (120g) + mini batatas assadas + béarnaise de vinho tinto + crispy de arroz negro, páprica defumada', 74, 'sem', null, true, false),
    (v_bar, c5, 'Espetinho de coração', 'Coração marinado (12und) + molho tarê + amendoim + gergelim + coentro', 46, 'sem', null, true, false),
    (v_bar, c5, 'Ceviche', 'Peixe + aji com coco + abacate + crispy de milho + batata doce roxa', 52, 'sem', null, true, false),

    (v_bar, c6, 'Batata Frita', 'Batata frita + aioli (porção 150g)', 24, 'sem', null, true, false),
    (v_bar, c6, 'Focaccia', 'Focaccia (porção)', 22, 'sem', null, true, false),

    (v_bar, c7, 'Extravagância', 'Bolo de chocolate + creme inglês de paçoca + farofa crocante + sorvete de pudim + brigadeiro', 34, 'sem', null, true, false),
    (v_bar, c7, 'Um Passeio pelo México', 'Churros + chantilly de ninho + sorvete de doce de leite + farofinha crocante', 32, 'sem', null, true, false);

  raise notice 'MiniBar Gem semeado no bar %', v_bar;
end $$;
