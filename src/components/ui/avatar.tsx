// src/components/ui/avatar.tsx

import React from 'react';

interface AvatarProps {
  src?: string;
  alt?: string;
  initials?: string;
  size?: number;
  className?: string;
}

const Avatar: React.FC<AvatarProps> = ({
  src,
  alt = "Avatar",
  initials,
  size = 50,
  className,
}) => {
  if (src) {
    // Si hay una URL válida, renderiza la imagen
    return (
      <img
        src={src}
        alt={alt}
        width={size}
        height={size}
        className={`rounded-full object-cover ${className}`}
      />
    );
  }

  // Si no hay imagen, muestra las iniciales
  return (
    <div
      style={{ width: size, height: size }}
      className={`flex items-center justify-center bg-gray-500 text-white rounded-full ${className}`}
    >
      {initials}
    </div>
  );
};

export { Avatar };
