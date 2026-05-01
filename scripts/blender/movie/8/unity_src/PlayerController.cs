// PlayerController.cs - Gameplay movement and interaction (Movie 8)

using UnityEngine;
using System.Collections;
using System.Collections.Generic;

namespace Movie8
{
    public class PlayerController : MonoBehaviour
    {
        [Header("Movement Settings")]
        [SerializeField] private float walkSpeed = 5f;
        [SerializeField] private float runSpeed = 8f;
        [SerializeField] private float jumpForce = 10f;
        [SerializeField] private float gravity = -20f;
        [SerializeField] private float accelerationTime = 0.2f; // Time to reach max speed
        
        [Header("References")]
        [SerializeField] private Camera playerCamera;
        [SerializeField] private Transform groundCheck;
        [SerializeField] private LayerMask groundMask;
        
        // Runtime state
        private CharacterController controller;
        private Animator animator;
        private Vector3 moveVelocity;
        private Vector3 currentVelocity;
        private Vector3 verticalVelocity;
        private bool isGrounded;
        private bool isRunning;
        
        private void Awake()
        {
            controller = GetComponent<CharacterController>();
            animator = GetComponent<Animator>();
            
            if (playerCamera == null)
                playerCamera = Camera.main;
        }
        
        private void Start()
        {
            Cursor.lockState = CursorLockMode.Locked;
            Cursor.visible = false;
        }
        
        private void Update()
        {
            HandleMovement();
            UpdateAnimations();
        }
        
        private void HandleMovement()
        {
            isGrounded = Physics.CheckSphere(groundCheck.position, 0.2f, groundMask);
            
            if (isGrounded && verticalVelocity.y < 0)
                verticalVelocity.y = -2f;
            
            float x = Input.GetAxisRaw("Horizontal");
            float z = Input.GetAxisRaw("Vertical");
            
            Vector3 targetDirection = (transform.right * x + transform.forward * z).normalized;
            
            isRunning = Input.GetKey(KeyCode.LeftShift) && z > 0;
            float targetSpeed = targetDirection.magnitude * (isRunning ? runSpeed : walkSpeed);
            
            // Organic acceleration using SmoothDamp
            // Psychological Rationale: Non-linear motion reflects biological movement patterns,
            // avoiding mechanical 'snap' and promoting a sense of natural flow.
            moveVelocity = Vector3.SmoothDamp(moveVelocity, targetDirection * targetSpeed, ref currentVelocity, accelerationTime);

            controller.Move(moveVelocity * Time.deltaTime);
            
            // Jump
            if (Input.GetButtonDown("Jump") && isGrounded)
            {
                verticalVelocity.y = Mathf.Sqrt(jumpForce * -2f * gravity);
            }
            
            verticalVelocity.y += gravity * Time.deltaTime;
            controller.Move(verticalVelocity * Time.deltaTime);
        }
        
        private void UpdateAnimations()
        {
            if (animator == null) return;
            
            float speed = new Vector3(controller.velocity.x, 0, controller.velocity.z).magnitude;
            float moveThreshold = 0.2f;
            
            animator.SetBool("IsGrounded", isGrounded);
            animator.SetFloat("Speed", speed);
            animator.SetBool("IsRunning", isRunning && speed > moveThreshold);
        }
    }
}
