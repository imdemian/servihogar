import { storage } from "../firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

/**
 * Sube un solo File a Storage y devuelve su URL pública.
 * @param {File} file
 * @param {string} path Ruta en Storage, p.ej. 'clientes/{uid}/equipos/{idx}/{filename}'
 */
export async function uploadFile(file, path) {
  // 1) Creamos la referencia
  const storageRef = ref(storage, path);
  // 2) Subimos el blob
  const snapshot = await uploadBytes(storageRef, file);
  // 3) Obtenemos la URL pública
  return await getDownloadURL(snapshot.ref);
}

/**
 * Sube varios archivos y devuelve un arreglo de URLs.
 * @param {FileList|File[]} files
 * @param {function(File, number): string} pathFn  Devuelve la ruta para cada file e índice
 */
export async function uploadFiles(files, pathFn) {
  const arr = Array.from(files);
  const uploads = arr.map((file, i) => uploadFile(file, pathFn(file, i)));
  return Promise.all(uploads);
}
