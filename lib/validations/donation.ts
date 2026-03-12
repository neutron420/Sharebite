import { z } from "zod";

export const donationSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  quantity: z.number().int().positive("Quantity must be positive"),
  category: z.enum([
    "VEG",
    "NON_VEG",
    "DAIRY",
    "BAKERY",
    "FRUITS_AND_VEGGIES",
    "COOKED_FOOD",
    "STAPLES",
    "PACKAGED_FOOD",
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
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  weight: z.number().nonnegative("Weight cannot be negative").optional(),
  imageUrl: z.string().url().optional().or(z.literal("")),
});

export type DonationInput = z.infer<typeof donationSchema>;
