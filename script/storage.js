// localStorage-ის უსაფრთხო გარსი: თუ ბრაუზერი მეხსიერებას კრძალავს,
// საიტი მაინც მუშაობს (უბრალოდ არჩევანი არ დაიმახსოვრება).
export function storageGet(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function storageSet(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}
