export interface PlaylistTrack {
  added_at: string;
  added_by: AddedBy;
  is_local: boolean;
  primary_color?: null;
  track: Track;
  video_thumbnail: VideoThumbnail;
}
export interface AddedBy {
  external_urls: ExternalUrls;
  href: string;
  id: string;
  type: string;
  uri: string;
}
export interface ExternalUrls {
  spotify: string;
}
export interface Track {
  album: Album;
  artists?: (ArtistsEntity)[] | null;
  available_markets?: (string)[] | null;
  disc_number: number;
  duration_ms: number;
  episode: boolean;
  explicit: boolean;
  external_ids: ExternalIds;
  external_urls: ExternalUrls;
  href: string;
  id: string;
  is_local: boolean;
  name: string;
  popularity: number;
  preview_url: string;
  track: boolean;
  track_number: number;
  type: string;
  uri: string;
}
export interface Album {
  album_type: string;
  artists?: (ArtistsEntity)[] | null;
  available_markets?: (string)[] | null;
  external_urls: ExternalUrls;
  href: string;
  id: string;
  images?: (ImagesEntity)[] | null;
  name: string;
  release_date: string;
  release_date_precision: string;
  total_tracks: number;
  type: string;
  uri: string;
}
export interface ArtistsEntity {
  external_urls: ExternalUrls;
  href: string;
  id: string;
  name: string;
  type: string;
  uri: string;
}
export interface ImagesEntity {
  height: number;
  url: string;
  width: number;
}
export interface ExternalIds {
  isrc: string;
}
export interface VideoThumbnail {
  url?: null;
}
