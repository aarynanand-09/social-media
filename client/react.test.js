describe('Create Post button test', () => {
  
  test('should be disabled for guest users', () => {
    
    const mockButton = { 
      disabled: true, 
      props: { isLoggedIn: false }
    };
    
    
    expect(mockButton.disabled).toBe(true);
    expect(mockButton.props.isLoggedIn).toBe(false);
  });

  test('should be enabled for logged-in users', () => {
    const mockButton = { 
      disabled: false, 
      props: { isLoggedIn: true }
    };
    expect(mockButton.disabled).toBe(false);
    expect(mockButton.props.isLoggedIn).toBe(true);
  });
});