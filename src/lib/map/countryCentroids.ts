import { Country, State } from 'country-state-city';
import type { Country as CountryType, State as StateType } from './geoTypes';

export function getAllCountries(): CountryType[] {
    return Country.getAllCountries();
}

export function getCountryByCode(isoCodeOrName: string): CountryType | undefined {
    // Try by code first
    const byCode = Country.getCountryByCode(isoCodeOrName);
    if (byCode) return byCode;

    // Try by name
    const all = getAllCountries();
    return all.find(c => c.name.toLowerCase() === isoCodeOrName.toLowerCase());
}

export function getStatesOfCountry(countryNameOrCode: string): StateType[] {
    const country = getCountryByCode(countryNameOrCode);
    if (!country) return [];
    return State.getStatesOfCountry(country.isoCode);
}

export function getStateByCode(countryCode: string, stateCodeOrName: string): StateType | undefined {
    const states = getStatesOfCountry(countryCode);
    // Try by code
    const byCode = states.find(state => state.isoCode === stateCodeOrName);
    if (byCode) return byCode;

    // Try by name
    return states.find(state => state.name.toLowerCase() === stateCodeOrName.toLowerCase());
}
