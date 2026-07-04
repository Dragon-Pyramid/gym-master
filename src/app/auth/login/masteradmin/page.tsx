import GymMasterLoginForm from '@/components/auth/GymMasterLoginForm';

export default function MasterAdminLoginPage() {
  return (
    <GymMasterLoginForm
      title='Acceso Master Admin'
      description='Puerta reservada para administración interna de Dragon Pyramid. No corresponde al acceso operativo del gimnasio cliente.'
      lockedRole='masteradmin'
      allowedRoles={['masteradmin']}
      backHref='/auth/login'
      backLabel='Login cliente'
      successRedirectHref='/dashboard/masteradmin/license'
    />
  );
}
