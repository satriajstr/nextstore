-- Jam operasional per toko (kasir hanya bisa akses di rentang ini)
-- NULL pada open_time/close_time = tidak ada batasan (24 jam)

ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS open_time time,
  ADD COLUMN IF NOT EXISTS close_time time;

COMMENT ON COLUMN public.stores.open_time IS 'Jam buka toko (WIB). NULL = tidak dibatasi.';
COMMENT ON COLUMN public.stores.close_time IS 'Jam tutup toko (WIB). NULL = tidak dibatasi.';
