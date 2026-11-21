/** Strings shared by the account forms (forgot password, security, account settings). */
export const ACCOUNT_STRINGS = {
  fr: {
    // Fields
    username: 'Pseudo',
    email: 'E-mail',
    code: 'Code reçu par e-mail',
    currentPassword: 'Mot de passe actuel',
    newPassword: 'Nouveau mot de passe',
    password: 'Mot de passe',
    confirmPassword: 'Confirmer le mot de passe',
    usernameRules: '3 à 20 caractères : lettres, chiffres et _.',
    passwordRules: '8 à 72 caractères, avec une minuscule, une majuscule, un chiffre et un symbole parmi @$!%*?&.',
    pending: 'Patientez…',

    // Validation
    errRequired: 'Remplis tous les champs.',
    errUsername: 'Le pseudo doit faire 3 à 20 caractères : lettres, chiffres et _ uniquement.',
    errEmail: 'Adresse e-mail invalide.',
    errPassword:
      'Le mot de passe doit faire 8 à 72 caractères, avec une minuscule, une majuscule, un chiffre et un symbole parmi @$!%*?&.',
    errPasswordMismatch: 'Les deux mots de passe ne correspondent pas.',
    errSamePassword: "Le nouveau mot de passe doit être différent de l'actuel.",
    errCode: 'Le code fait 8 caractères (lettres et chiffres).',

    // Forgot password
    forgotLink: 'Mot de passe oublié ?',
    forgotTitle: 'Mot de passe oublié',
    forgotIntro: "Indique l'adresse e-mail de ton compte : nous t'envoyons un code pour choisir un nouveau mot de passe.",
    forgotSend: 'Recevoir un code',
    forgotSent:
      'Si un compte existe pour {email}, un code vient de lui être envoyé. Il est valable 30 minutes. Pense à vérifier les indésirables.',
    forgotCodeHint: '8 caractères. Le code se bloque après 5 essais erronés.',
    forgotSubmit: 'Changer le mot de passe',
    forgotDone: 'Mot de passe modifié. Tu peux te connecter avec le nouveau.',
    backToLogin: 'Retour à la connexion',
    back: 'Retour',
    changeEmail: "Changer d'adresse",
    resend: 'Envoyer un nouveau code',
    resendIn: 'Nouveau code possible dans {seconds} s',

    // Change password
    changeIntro: 'Après le changement, tes autres appareils sont déconnectés. Celui-ci reste connecté.',
    changeSubmit: 'Changer le mot de passe',
    changeDone: 'Mot de passe modifié. Tes autres appareils ont été déconnectés.',
    changeGuest: "Un invité n'a pas de mot de passe. Crée ton compte dans la section Compte pour sécuriser ta progression.",

    // E-mail verification
    verifyTitle: 'Adresse e-mail',
    verified: 'Vérifiée',
    notVerified: 'Non vérifiée',
    verifyIntro: "Confirme que cette adresse est bien la tienne : c'est elle qui reçoit le code en cas de mot de passe oublié.",
    verifySend: 'Recevoir un code',
    verifyHaveCode: "J'ai déjà un code",
    verifySent: 'Code envoyé à {email}. Il est valable 24 heures.',
    verifyCodeHint: '8 caractères. Le code se bloque après 5 essais erronés.',
    verifySubmit: 'Vérifier',
    verifyDone: 'Adresse vérifiée.',

    // Guest → account
    upgradeTitle: 'Créer mon compte',
    upgradeIntro:
      "Tu joues en invité. Crée ton compte pour garder ta progression (niveau, crédits, historique) et la retrouver sur n'importe quel appareil.",
    upgradeSubmit: 'Créer mon compte',
    upgradeDone: 'Compte créé. Ta progression est conservée.',

    // Username row
    usernameEdit: 'Modifier le pseudo',
    usernameSave: 'Enregistrer le pseudo',
    usernameCancel: 'Annuler la modification',
  },
  en: {
    // Fields
    username: 'Username',
    email: 'E-mail',
    code: 'Code received by e-mail',
    currentPassword: 'Current password',
    newPassword: 'New password',
    password: 'Password',
    confirmPassword: 'Confirm password',
    usernameRules: '3 to 20 characters: letters, digits and _.',
    passwordRules: '8 to 72 characters, with a lowercase letter, an uppercase letter, a digit and a symbol among @$!%*?&.',
    pending: 'Please wait…',

    // Validation
    errRequired: 'Fill in every field.',
    errUsername: 'The username must be 3 to 20 characters: letters, digits and _ only.',
    errEmail: 'Invalid e-mail address.',
    errPassword:
      'The password must be 8 to 72 characters, with a lowercase letter, an uppercase letter, a digit and a symbol among @$!%*?&.',
    errPasswordMismatch: 'The two passwords do not match.',
    errSamePassword: 'The new password must be different from the current one.',
    errCode: 'The code is 8 characters long (letters and digits).',

    // Forgot password
    forgotLink: 'Forgot password?',
    forgotTitle: 'Forgot password',
    forgotIntro: 'Enter the e-mail address of your account: we will send you a code to choose a new password.',
    forgotSend: 'Send me a code',
    forgotSent:
      'If an account exists for {email}, a code has just been sent to it. It is valid for 30 minutes. Remember to check your spam folder.',
    forgotCodeHint: '8 characters. The code locks after 5 wrong attempts.',
    forgotSubmit: 'Change password',
    forgotDone: 'Password changed. You can log in with the new one.',
    backToLogin: 'Back to login',
    back: 'Back',
    changeEmail: 'Use another address',
    resend: 'Send a new code',
    resendIn: 'New code available in {seconds} s',

    // Change password
    changeIntro: 'After the change, your other devices are signed out. This one stays signed in.',
    changeSubmit: 'Change password',
    changeDone: 'Password changed. Your other devices have been signed out.',
    changeGuest: 'A guest has no password. Create your account in the Account section to secure your progress.',

    // E-mail verification
    verifyTitle: 'E-mail address',
    verified: 'Verified',
    notVerified: 'Not verified',
    verifyIntro: 'Confirm this address is really yours: it is the one that receives the code if you forget your password.',
    verifySend: 'Send me a code',
    verifyHaveCode: 'I already have a code',
    verifySent: 'Code sent to {email}. It is valid for 24 hours.',
    verifyCodeHint: '8 characters. The code locks after 5 wrong attempts.',
    verifySubmit: 'Verify',
    verifyDone: 'Address verified.',

    // Guest → account
    upgradeTitle: 'Create my account',
    upgradeIntro:
      'You are playing as a guest. Create your account to keep your progress (level, credits, history) and find it on any device.',
    upgradeSubmit: 'Create my account',
    upgradeDone: 'Account created. Your progress is kept.',

    // Username row
    usernameEdit: 'Edit username',
    usernameSave: 'Save username',
    usernameCancel: 'Cancel editing',
  },
} as const;
