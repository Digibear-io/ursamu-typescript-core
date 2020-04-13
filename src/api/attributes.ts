import db, { DBObj } from "./database";
import flags from "./flags";

export interface Attribute {
  name: string;
  value: string;
  setBy: string;
}

/**
 * Get an attribute by name.
 * @param en Enactor DBObj
 * @param tar Target DBObj
 * @param attr The name of the attribute to grab.
 */
export const get = (en: DBObj, tar: DBObj, attr: string) => {
  if (flags.canEdit(en, tar)) {
    return tar.attributes.find(
      attrib => attrib.name.toLowerCase() === attr.toLowerCase()
    );
  }
};

/**
 * Set an attribute on a DBObj.
 * @param en Enactor DBObj
 * @param tar Target DBObj
 * @param attribute The attribute to set
 * @param value The value to set the attribute.
 */
export const set = async (
  en: DBObj,
  tar: DBObj,
  attribute: string,
  value: string
) => {
  const attrSet = new Set(tar.attributes);
  const attr = get(en, tar, attribute);
  if (flags.canEdit(en, tar)) {
    if (attr) {
      // Existing attribute
      attr.value = value;
      attr.lastEdit = en.id;
    } else {
      // new attribute
      attrSet.add({
        name: attribute,
        value,
        lastEdit: en.id
      });

      // Update the target DBObj
      tar.attributes = Array.from(attrSet);
      return await db.update({ id: tar.id }, tar);
    }
  }
};
