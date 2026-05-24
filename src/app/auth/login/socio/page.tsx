import GymMasterLoginForm from '@/components/auth/GymMasterLoginForm';

export default function LoginSocioPage() {
  return (
    <GymMasterLoginForm
      title='Ingreso de Socio'
      description='Accedé directamente a tu cuenta de socio.'
      lockedRole='socio'
      allowedRoles={['socio']}
    />
  );
}
