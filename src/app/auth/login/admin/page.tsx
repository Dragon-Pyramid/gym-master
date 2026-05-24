import GymMasterLoginForm from '@/components/auth/GymMasterLoginForm';

export default function LoginAdminPage() {
  return (
    <GymMasterLoginForm
      title='Ingreso Administración'
      description='Acceso para administradores y usuarios internos.'
      allowedRoles={['admin', 'usuario']}
      defaultRole='admin'
    />
  );
}
