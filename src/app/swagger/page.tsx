import { notFound } from 'next/navigation';
import { SwaggerClient } from './SwaggerClient';

export const dynamic = 'force-dynamic';

export default function SwaggerPage() {
  const isProduction = process.env.NODE_ENV === 'production';
  const explicitlyExposed =
    process.env.EXPOSE_SWAGGER_DOCUMENTATION === 'true';

  if (isProduction && !explicitlyExposed) {
    notFound();
  }

  return <SwaggerClient />;
}
