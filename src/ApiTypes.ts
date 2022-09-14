import { OpenAPIV3 } from "express-oas-generator";

export interface SignInRequestView {
    /** @description Addresses of the accounts to be signed in */
    addresses?: string[];
}

export interface SignInResponseView {
    /**
     * Format: uuid
     * @description Session identifier
     * @example 5e4ef4bb-8657-444c-9880-d89e9403fc85
     */
    sessionId?: string;
}

export interface SignatureView {
    /** @description <p>A base64-encoded SHA256 hash of a concatenation of</p><ol><li>a resource</li><li>an operation</li><li>the <code>signedOn</code> field</li><li>additional fields in function of the request</li></ol> */
    signature?: string;
    /**
     * Format: date-time
     * @description The signature's timestamp
     */
    signedOn?: string;
    /**
     * @description The type of signature. If not set, POLKADOT is assumed.
     * @enum {string}
     */
    type?: "POLKADOT" | "ETHEREUM";
}

export interface AuthenticateRequestView {
    /**
     * @description A map of signatures, index by SS58 addresses of authentication requester
     * @example [object Object]
     */
    signatures?: { [key: string]: SignatureView };
}

export interface AuthenticateResponseView {
    /**
     * @description A map of tokens, indexed by SS58 address of authentication requester
     * @example [object Object]
     */
    tokens?: { [key: string]: TokenView };
}

export interface TokenView {
    /** @description The encoded JWT token */
    value?: string;
    /**
     * Format: date-time
     * @description The token expiration timestamp
     */
    expiredOn?: string;
}

export interface RefreshRequestView {
    /**
     * @description A map of tokens, index by SS58 addresses of refresh requester
     * @example [object Object]
     */
    tokens?: { [key: string]: string };
}

export const schemas: Record<string, OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject> = {
    "SignInRequestView": {
        "type": "object",
        "properties": {
            "addresses": {
                "type": "array",
                "description": "Addresses of the accounts to be signed in",
                "items": {
                    "type": "string",
                    "description": "The SS58 address of the account to be signed in",
                    "example": "5HQjUUY1uiuWoQyAgHNnYM31vvquBkAHyGpqBQYWqVrGKsdb"
                }
            }
        },
        "title": "SignInRequestView",
        "description": "the sign-in request"
    },
    "SignInResponseView": {
        "type": "object",
        "properties": {
            "sessionId": {
                "type": "string",
                "format": "uuid",
                "description": "Session identifier",
                "example": "5e4ef4bb-8657-444c-9880-d89e9403fc85"
            }
        },
        "title": "SignInResponseView",
        "description": "the sign-in response"
    },
    "SignatureView": {
        "type": "object",
        "properties": {
            "signature": {
                "type": "string",
                "description": "<p>A base64-encoded SHA256 hash of a concatenation of</p><ol><li>a resource</li><li>an operation</li><li>the <code>signedOn</code> field</li><li>additional fields in function of the request</li></ol>"
            },
            "signedOn": {
                "type": "string",
                "format": "date-time",
                "description": "The signature's timestamp"
            },
            "type": {
                "type": "string",
                "description": "The type of signature. If not set, POLKADOT is assumed.",
                "enum": [
                    "POLKADOT",
                    "ETHEREUM"
                ]
            }
        },
        "title": ""
    },
    "TokenView": {
        "type": "object",
        "properties": {
            "value": {
                "type": "string",
                "description": "The encoded JWT token"
            },
            "expiredOn": {
                "type": "string",
                "format": "date-time",
                "description": "The token expiration timestamp"
            }
        }
    },
    "AuthenticateRequestView": {
        "type": "object",
        "properties": {
            "signatures": {
                "type": "object",
                "additionalProperties": {
                    "$ref": "#/components/schemas/SignatureView"
                },
                "description": "A map of signatures, index by SS58 addresses of authentication requester",
                "example": {
                    "5GEpejzbL7Ch8hrRuWsTVCfVRLFZm1zKMF989J4NSiH8JwPn": {
                        "signature": "0xdc54e22464db114b570ea21ec499181fb1fb3c2582529....",
                        "signedOn": "2021-09-17T13:13:05.833"
                    },
                    "5HQjUUY1uiuWoQyAgHNnYM31vvquBkAHyGpqBQYWqVrGKsdb": {
                        "signature": "0xdc54e22464db114b570ea21ec499181fb1fb3c2582529....",
                        "signedOn": "2021-09-17T13:13:05.833"
                    }
                }
            }
        },
        "title": "AuthenticateRequestView",
        "description": "the authentication request"
    },
    "AuthenticateResponseView": {
        "type": "object",
        "properties": {
            "tokens": {
                "type": "object",
                "additionalProperties": {
                    "$ref": "#/components/schemas/TokenView"
                },
                "description": "A map of tokens, indexed by SS58 address of authentication requester",
                "example": {
                    "5GEpejzbL7Ch8hrRuWsTVCfVRLFZm1zKMF989J4NSiH8JwPn": {
                        "value": "eyJhbGciOiJIUzM4NCI....",
                        "expiredOn": "2021-09-17T14:13:06.000"
                    },
                    "5HQjUUY1uiuWoQyAgHNnYM31vvquBkAHyGpqBQYWqVrGKsdb": {
                        "value": "eyJhbGciOiJIUzM4NCI....",
                        "expiredOn": "2021-09-17T14:13:06.000"
                    }
                }
            }
        },
        "title": "AuthenticateResponseView",
        "description": "the authentication response"
    },
    "RefreshRequestView": {
        "type": "object",
        "properties": {
            "tokens": {
                "type": "object",
                "additionalProperties": {
                    "type": "string",
                    "description": "The token to refresh"
                },
                "description": "A map of tokens, index by SS58 addresses of refresh requester",
                "example": {
                    "5GEpejzbL7Ch8hrRuWsTVCfVRLFZm1zKMF989J4NSiH8JwPn": "eyJhbGciOiJIUzM4NCI....",
                    "5HQjUUY1uiuWoQyAgHNnYM31vvquBkAHyGpqBQYWqVrGKsdb": "eyJhbGciOiJIUzM4NCI...."
                }
            }
        },
        "title": "RefreshRequestView",
        "description": "the refresh request"
    },
};
