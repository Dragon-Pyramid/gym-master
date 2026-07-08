import GymMasterLoginForm from '@/components/auth/GymMasterLoginForm';

export default function MasterAdminLoginPage() {
  return (
    <GymMasterLoginForm
      title='Acceso Master Admin'
      description='Reserved access for Dragon Pyramid internal administration. This is not the operational login for the client gym.'
      titleKey='login.masterFormTitle'
      descriptionKey='login.masterFormDescription'
      lockedRole='masteradmin'
      allowedRoles={['masteradmin']}
      backHref='/auth/login'
      backLabel='Login cliente'
      backLabelKey='login.clientLogin'
      successRedirectHref='/dashboard/masteradmin/license'
    />
  );
}
