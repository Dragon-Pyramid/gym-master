import GymMasterLoginForm from '@/components/auth/GymMasterLoginForm';

export default function LoginSocioPage() {
  return (
    <GymMasterLoginForm
      title='Ingreso de Socio'
      description='Accedé directamente a tu cuenta de socio.'
      titleKey='login.memberFormTitle'
      descriptionKey='login.memberFormDescription'
      lockedRole='socio'
      allowedRoles={['socio']}
    />
  );
}
