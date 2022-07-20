import * as fs from 'fs';

export const uploadImage = (path: string, buffer: string, name: string) => {
  if (!fs.existsSync(path)) {
    fs.mkdirSync(path, { recursive: true });
  }
  fs.writeFile(`${path}/${name}.png`, buffer, (error) => {
    if (error) throw error;
  });
};
