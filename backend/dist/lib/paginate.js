export function paginate(page, pageSize) {
    const skip = (page - 1) * pageSize;
    const take = pageSize;
    return { skip, take };
}
//# sourceMappingURL=paginate.js.map