export class HttpException extends Error {
    msg: string;
    errorCode: ErrCodes;
    statusCode: statusCodes;
    errors: any;

    constructor(msg: string, errorCode: ErrCodes, statusCode: statusCodes, errors: any){
        super(msg) // Appelle le constructeur de la classe "Error" (parent de la classe HttpException) et initie le message d'erreur
        this.msg = msg;
        this.errorCode = errorCode;
        this.statusCode = statusCode;
        this.errors = errors;
    }
}

export enum ErrCodes {
    USER_NOT_FOUND = 1002,         // Utilisateur introuvable
    USER_ALREADY_EXISTS = 1002,    // Utilisateur déjà existant
    INCORRECT_PASSWORD = 1003,     // Mot de passe incorrect
    INVALID_EMAIL = 1004,          // Email malformé ou invalide
    UNAUTHORIZED_ACCESS = 1005,    // Accès non autorisé
    ACCOUNT_LOCKED = 1006,         // Compte verrouillé
    SESSION_EXPIRED = 1007,        // Session expirée
    INVALID_TOKEN = 1008,          // Jeton d'authentification invalide
    DATABASE_ERROR = 1009,         // Erreur générale de base de données
    INTERNAL_SERVER_ERROR = 1010   // Erreur interne du serveur
}


export enum statusCodes {
    BAD_REQUEST = 400,        // Mauvaise requête provient du client
    NOT_FOUND = 404,          // Ressource non trouvée
    UNAUTHORIZED = 401,       // Non autorisé
    FORBIDDEN = 403,          // Accès interdit
    INTERNAL_SERVER_ERROR = 500,  // Erreur interne du serveur
    SERVICE_UNAVAILABLE = 503,    // Service indisponible
    GATEWAY_TIMEOUT = 504,        // Délai d'attente dépassé
    OK = 200,                  // Requête réussie
    CREATED = 201,             // Ressource créée
    NO_CONTENT = 204,          // Pas de contenu
    ACCEPTED = 202             // Requête acceptée, mais non traitée
}

// export class NotFoundException extends HttpException {
//     constructor(message: string, errorCode: ErrCodes){
//         super(message, errorCode, 404, null);
//     }
// }