import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const X_API_BEARER = Deno.env.get('X_API_BEARER_TOKEN');
const GROK_API_KEY = Deno.env.get('XAI_API_KEY');
const GROK_API_URL = 'https://api.x.ai/v1/chat/completions';

const OFFICIAL_ACCOUNTS = [
  'DeptofDefense', 'USNavy', 'USSOUTHCOM', 'USFleetForces', 'Defensenews',
  'NavyTimes', 'USNI_News', 'CENTCOM_CI', 'US_EUCOM', 'PacificCommand',
  'DeptoftheNavy', 'USMC', 'USArmy', 'usairforce', 'SOUTHCOMWATCH', 'MaritimeBulk',
  'SecWar', 'SecDef', 'POTUS', 'USCoastGuard', 'StateDept', 'DHSgov'
];