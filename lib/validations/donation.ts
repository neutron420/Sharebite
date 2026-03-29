import { z } from "zod";

export const donationSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional().or(z.literal("")),
  quantity: z.coerce.number().int().positive("Quantity must be positive"),
  category: z.enum([
    "VEG",
    "NON_VEG",
    "DAIRY",
    "BAKERY",
    "FRUITS_AND_VEGGIES",
    "COOKED_FOOD",
    "STAPLES",
    "PACKAGED_FOOD",
    "BEVERAGES",
    "CANNED_GOODS",
    "FROZEN_FOOD",
    "OTHERS"
  ]),
  expiryTime: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date format for expiry time",
  }),
  pickupStartTime: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date format for pickup start time",
  }),
  pickupEndTime: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date format for pickup end time",
  }),
  pickupLocation: z.string().min(5, "Pickup location must be at least 5 characters"),
  city: z.string().min(2, "City must be at least 2 characters"),
  state: z.string().optional(),
  district: z.string().optional(),
  pincode: z.string().optional(),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
  weight: z.coerce.number().nonnegative("Weight cannot be negative").optional(),
  imageUrl: z.string().url().optional().or(z.literal("")),
});

export type DonationInput = z.infer<typeof donationSchema>;
