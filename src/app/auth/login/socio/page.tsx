import GymMasterLoginForm from '@/components/auth/GymMasterLoginForm';

export default function LoginSocioPage() {
  return (
    <GymMasterLoginForm
      title='Member sign-in'
      description='Access your member account directly.'
      titleKey='login.memberFormTitle'
      descriptionKey='login.memberFormDescription'
      lockedRole='socio'
      allowedRoles={['socio']}
    />
  );
}
