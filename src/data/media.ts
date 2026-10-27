/**
 * Imagens das seções "Experiência" e "Galeria".
 *
 * Fotos ilustrativas de bancos gratuitos (veja src/data/photos.json). Quando a
 * loja tiver fotos próprias, troque os itens aqui. Não use fotos de terceiros
 * sem licença nem imagens "da loja" que não sejam da loja.
 *
 * width/height definem a proporção do quadro no layout; a foto é recortada
 * (object-cover) para preencher.
 */
import { getPhoto, photoCredit, photoSrc } from "./photos";

export type MediaItem = {
  src: string;
  alt: string;
  width: number;
  height: number;
  caption?: string;
  /** Render de layout (mostra o selo "Imagem provisória"). */
  placeholder?: boolean;
  /** Crédito do banco de imagens. */
  credit?: string;
  /** Página da foto original. */
  page?: string;
  /** Imagem local usada se a foto não carregar. */
  fallback?: string;
};

function fromPhoto(id: string, width: number, height: number, caption?: string): MediaItem {
  const p = getPhoto(id);
  return { src: photoSrc(p), alt: p.alt, width, height, caption, credit: photoCredit(p), page: p.page, fallback: p.fallback };
}

export const EXPERIENCE_MEDIA: MediaItem[] = [
  fromPhoto("exp-cremoso", 1400, 1000, "Açaí cremoso"),
  fromPhoto("exp-morangos", 1000, 1250, "Morangos"),
  fromPhoto("exp-granola", 1000, 1250, "Granola"),
  fromPhoto("exp-coberturas", 1400, 1000, "Coberturas"),
  fromPhoto("exp-copos", 1600, 1000, "Copos prontos"),
];

export const GALLERY: MediaItem[] = [
  fromPhoto("gal-duas-tigelas", 1000, 1250),
  fromPhoto("gal-prancha", 1600, 1000),
  fromPhoto("gal-tigela-madeira", 1000, 1250),
  fromPhoto("gal-feira", 1000, 1000),
  fromPhoto("gal-amoras", 1000, 1250),
  fromPhoto("gal-banana", 1000, 1250),
];
