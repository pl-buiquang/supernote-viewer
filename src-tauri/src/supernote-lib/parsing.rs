use std::collections::HashMap;
use std::str;
use std::string::FromUtf8Error;

#[derive(Debug)]
pub struct LayerInfo {
    pub layer_id: i32,
    pub name: String,
    pub is_background_layer: bool,
    pub is_allow_add: bool,
    pub is_current_layer: bool,
    pub is_visible: bool,
    pub is_deleted: bool,
    pub is_allow_up: bool,
    pub is_allow_down: bool,
}

fn check_offset(offset: usize, ext: usize, length: usize) {
    if offset % 1 != 0 || offset < 0 {
        panic!("offset is not uint");
    }
    if offset + ext > length {
        panic!("Trying to access beyond buffer length");
    }
}

fn read_uint_le(data: &[u8], offset: usize, byte_length: usize) -> u64 {
    check_offset(offset, byte_length, data.len());

    let mut val = data[offset] as u64;
    let mut mul = 1;
    let mut i = 0;
    while i < byte_length - 1 {
        mul *= 0x100;
        val += (data[offset + i + 1] as u64) * mul;
        i += 1;
    }

    val
}

fn get_content_at_address(buffer: &[u8], address: usize, byte_length: usize) -> Option<Vec<u8>> {
    if address == 0 {
        return None;
    }
    let block_length = read_uint_le(buffer, address, byte_length) as usize;
    let content = buffer[address + byte_length..address + byte_length + block_length].to_vec();
    Some(content)
}

fn parse_key_value(buffer: &[u8], address: usize, byte_length: usize) -> HashMap<String, Vec<String>> {
    let content = get_content_at_address(buffer, address, byte_length);
    if content.is_none() {
        return HashMap::new();
    }
    let str_content = uint8_array_to_string(&content.unwrap()).unwrap();
    extract_key_value(&str_content)
}

fn extract_key_value(content: &str) -> HashMap<String, Vec<String>> {
    let pattern = regex::Regex::new(r#"<([^:<>]+):([^:<>]+)>"#).unwrap();
    let mut data = HashMap::new();

    for caps in pattern.captures_iter(content) {
        let key = caps.get(1).unwrap().as_str().to_string();
        let value = caps.get(2).unwrap().as_str().to_string();
        data.entry(key).or_insert_with(Vec::new).push(value);
    }

    data
}

fn extract_nested_key_value(
    record: HashMap<String, Vec<String>>,
    delimiter: &str,
    prefixes: &[&str],
) -> HashMap<String, HashMap<String, String>> {
    let mut data = HashMap::new();

    for (key, value) in record {
        let mut main = None;
        let mut sub = None;

        if value.len() != 1 {
            continue;
        }
        let value = &value[0];

        if let Some(idx) = key.find(delimiter) {
            main = Some(&key[..idx]);
            sub = Some(&key[idx + 1..]);
        } else {
            for &prefix in prefixes {
                if key.starts_with(prefix) {
                    main = Some(prefix);
                    sub = Some(&key[prefix.len()..]);
                    break;
                }
            }
        }

        if let (Some(main), Some(sub)) = (main, sub) {
            data.entry(main.to_string())
                .or_insert_with(HashMap::new)
                .insert(sub.to_string(), value.to_string());
        }
    }

    data
}

fn extract_layer_info(content: &str) -> Vec<LayerInfo> {
    let layer_pattern = regex::Regex::new(r#"\{(?<content>[^\{\}]+)\}"#).unwrap();
    let dict_pattern = regex::Regex::new(r#"(?<key>[^"\[\{\}\]]+)"\#"(?<value>[^"\[\{\}\],]+)"#).unwrap();

    let mut layer_infos = Vec::new();

    for layer_match in layer_pattern.captures_iter(content) {
        let layer_content = layer_match.name("content").unwrap().as_str();
        let mut data = HashMap::new();

        for dict_match in dict_pattern.captures_iter(layer_content) {
            let key = dict_match.name("key").unwrap().as_str().to_string();
            let value = dict_match.name("value").unwrap().as_str().to_string();
            data.insert(key, value);
        }

        let layer_info = LayerInfo {
            layer_id: data.get("layerId").unwrap_or(&"0".to_string()).parse().unwrap_or(0),
            name: data.get("name").unwrap_or(&"Main layer".to_string()).to_string(),
            is_background_layer: data.get("isBackgroundLayer").unwrap_or(&"false".to_string()) == "true",
            is_allow_add: data.get("isAllowAdd").unwrap_or(&"false".to_string()) == "true",
            is_current_layer: data.get("isCurrentLayer").unwrap_or(&"false".to_string()) == "true",
            is_visible: data.get("isVisible").unwrap_or(&"false".to_string()) == "true",
            is_deleted: data.get("isDeleted").unwrap_or(&"false".to_string()) == "true",
            is_allow_up: data.get("isAllowUp").unwrap_or(&"false".to_string()) == "true",
            is_allow_down: data.get("isAllowDown").unwrap_or(&"false".to_string()) == "true",
        };

        layer_infos.push(layer_info);
    }

    layer_infos
}

fn uint8_array_to_string(uint8_array: &[u8]) -> Result<String, FromUtf8Error> {
    String::from_utf8(uint8_array.to_vec())
}