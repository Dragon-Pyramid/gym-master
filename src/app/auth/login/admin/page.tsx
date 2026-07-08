import GymMasterLoginForm from '@/components/auth/GymMasterLoginForm';

export default function LoginAdminPage() {
  return (
    <GymMasterLoginForm
      title='Administration sign-in'
      description='Access for administrators and internal users.'
      titleKey='login.adminFormTitle'
      descriptionKey='login.adminFormDescription'
      allowedRoles={['admin', 'usuario']}
      defaultRole='admin'
    />
  );
}
