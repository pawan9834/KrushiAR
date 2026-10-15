// services/pincodeService.ts

export interface PincodeInfo {
  pincode: string;
  city: string;
  district: string;
  state: string;
  block?: string;
  postOffices: string[];
}


export async function lookupPincode(pincode: string): Promise<PincodeInfo | null> {
  const clean = pincode.replace(/\D/g, '').slice(0, 6);
  if (clean.length !== 6) return null;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(`https://api.postalpincode.in/pincode/${clean}`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) return null;

    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0 || data[0].Status !== 'Success') {
      return null;
    }

    const postOffices = data[0].PostOffice || [];
    if (postOffices.length === 0) return null;

    // Prefer main sub post office or head office as main city/taluka
    const primary =
      postOffices.find(
        (p: any) => p.BranchType === '' || p.BranchType === ''
      ) || postOffices[0];

    const district = primary.District || '';
    const state = primary.State || '';
    const city = primary.Name || primary.Block || district;

    const names: string[] = Array.from(
      new Set(postOffices.map((p: any) => p.Name).filter(Boolean))
    );

    return {
      pincode: clean,
      city,
      district,
      state,
      block: primary.Block,
      postOffices: names,
    };
  } catch (err) {
    console.warn('Pincode lookup notice:', err);
    return null;
  }
}
