import { peer } from '../lib/peer';

export function FilePicker({ onChange }) {
  return (
    <input
      type="file"
      id="input"
      multiple
      onChange={onChange}
    />
  )
}
