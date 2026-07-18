-- Destination-correlated cover image for itinerary trip cards.
ALTER TABLE travel_plans
    ADD COLUMN IF NOT EXISTS cover_image_url TEXT;
