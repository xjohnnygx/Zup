def filter_filetype(fileType: str) -> str:
    if fileType == "audio":
        return "audios"
    elif fileType == "image":
        return "images"
    elif fileType == "video":
        return "videos"
    else:
        return "documents"