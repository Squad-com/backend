describe('First', () => {
  it('First test ', () => {
    const mockFunction = jest.fn();
    mockFunction.mockReturnValue(1);
    const result = mockFunction();
    expect(result).toBe(1);
  });
});
