import { IopaContext } from 'iopa-types';
import { ICredentialProvider } from './credentialProvider';
import { ClaimsIdentity } from './claimsIdentity';
/**
 * Validate the incoming Headers sent from the Carrier Service.
 * @param  {string} authHeader The raw HTTP header in the format: "Bearer [longString]"
 * @param  {ICredentialProvider} credentials The user defined set of valid credentials, such as the AppId.
 * @returns {Promise<ClaimsIdentity>} A valid ClaimsIdentity.
 */
export declare function authenticateCarrierContext(context: IopaContext, credentials: ICredentialProvider): Promise<ClaimsIdentity>;
