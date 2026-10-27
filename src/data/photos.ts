import { site } from "@/config/site";
import data from "./photos.json";

export type PhotoSource = "unsplash" | "pexels";

export type Photo = {
  id: string;
  source: PhotoSource;
  /** URL original no banco de imagens. */
  remote: string;
  /** Página da foto (crédito e licença). */
  page: string;
  /** Nome do fotógrafo, quando confirmado na página da foto. */
  author: string | null;
  alt: string;
  /** Render local exibido se a foto remota não carregar. */
  fallback: string;
};

const PHOTOS = new Map<string, Photo>((data.photos as Photo[]).map((p) => [p.id, p]));

export function getPhoto(id: string): Photo {
  const photo = PHOTOS.get(id);
  if (!photo) throw new Error(`Foto "${id}" não encontrada em src/data/photos.json`);
  return photo;
}

/**
 * Endereço usado no site: a cópia local (depois de `npm run fotos`) ou a URL
 * original. O next/image otimiza e guarda em cache as duas.
 */
export function photoSrc(photo: Photo) {
  return site.localPhotos ? `/images/fotos/${photo.id}.jpg` : photo.remote;
}

export function photoCredit(photo: Photo) {
  const bank = photo.source === "unsplash" ? "Unsplash" : "Pexels";
  return photo.author ? `${photo.author} / ${bank}` : bank;
}

export const ALL_PHOTOS = [...PHOTOS.values()];
