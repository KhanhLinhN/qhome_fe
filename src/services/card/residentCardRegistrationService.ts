import axios from "@/src/lib/axios";
import {
  CardRegistration,
  CardRegistrationDecisionPayload,
  CardRegistrationFilter,
} from "@/src/types/cardRegistration";

const CARD_SERVICE_BASE_URL =
  process.env.NEXT_PUBLIC_CARD_SERVICE_URL ||
  process.env.NEXT_PUBLIC_BASE_URL ||
  "http://localhost:8081";

const basePath = `${CARD_SERVICE_BASE_URL}/api/resident-card`;

export async function fetchResidentCardRegistrations(
  filter?: CardRegistrationFilter
): Promise<CardRegistration[]> {
  const response = await axios.get(`${basePath}/admin/registrations`, {
    params: filter,
    withCredentials: true,
  });
  return response.data;
}

export async function fetchResidentCardRegistration(
  registrationId: string
): Promise<CardRegistration> {
  const response = await axios.get(
    `${basePath}/admin/registrations/${registrationId}`,
    {
      withCredentials: true,
    }
  );
  return response.data;
}

export async function decideResidentCardRegistration(
  registrationId: string,
  payload: CardRegistrationDecisionPayload
): Promise<CardRegistration> {
  const response = await axios.post(
    `${basePath}/admin/registrations/${registrationId}/decision`,
    payload,
    {
      withCredentials: true,
    }
  );
  return response.data;
}


