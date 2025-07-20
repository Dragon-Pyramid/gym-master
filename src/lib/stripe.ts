import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY no esta definido");
}
// Inicializar Stripe con la clave secreta
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)