def format_display_name(display_name: str) -> str:
    cleaned = " ".join(display_name.strip().split())
    if not cleaned:
        return cleaned

    words = cleaned.split(" ")
    formatted_words = []
    for word in words:
        head = word[:1].upper()
        tail = word[1:].lower()
        formatted_words.append(f"{head}{tail}")

    return " ".join(formatted_words)
